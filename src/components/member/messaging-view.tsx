'use client';

// ============================================================
// Messaging — conversations + chat with simulated replies
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hash, Loader2, MessageSquare, MessageSquarePlus, Search, Send, Trash2, X, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { messagingApi, usersApi, connectionsApi } from '@/lib/db/client';
import type { Conversation, User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn, timeAgo } from '@/lib/format';

// ---------------- New direct message dialog ----------------
function NewMessageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<User | null>(null);
  const [firstMessage, setFirstMessage] = useState('');

  const { data: connections = [] } = useQuery({
    queryKey: ['connections', user?.id],
    queryFn: () => connectionsApi.network(org!.id, user!.id),
    enabled: open && !!user,
  });
  const { data: directory = [] } = useQuery({
    queryKey: ['directory', org?.id],
    queryFn: () => usersApi.searchDirectory(org!.id, user!.id),
    enabled: open && !!user,
  });
  const acceptedIds = new Set(connections.filter(c => c.status === 'ACCEPTED').flatMap(c => [c.requesterId, c.recipientId]));
  const candidates = directory.filter(m => acceptedIds.has(m.id));

  const mutation = useMutation({
    mutationFn: () => messagingApi.startDirect(org!.id, user!.id, selected!.id, firstMessage.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onOpenChange(false); setSelected(null); setFirstMessage('');
      toast.success('Conversation started.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Direct chat invitations are available to your accepted connections.</DialogDescription>
        </DialogHeader>
        {!selected ? (
          <div className="max-h-72 space-y-1 overflow-y-auto custom-scrollbar">
            {candidates.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No accepted connections yet — connect with members in the Network tab first.</p>}
            {candidates.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-muted/60">
                <UserAvatar user={c} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.firstName} {c.lastName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.profile?.title ?? 'Member'}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2.5">
              <UserAvatar user={selected} size="sm" />
              <p className="text-sm font-medium">{selected.firstName} {selected.lastName}</p>
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setSelected(null)} aria-label="Change recipient">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input value={firstMessage} onChange={e => setFirstMessage(e.target.value)} placeholder={`Write a first message to ${selected.firstName}…`} onKeyDown={e => e.key === 'Enter' && firstMessage.trim() && mutation.mutate()} autoFocus />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected || !firstMessage.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Chat view ----------------
function ChatView({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const navigate = useAppStore(s => s.navigate);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const other = conversation.type === 'DIRECT'
    ? conversation.participantIds.find(p => p !== user?.id)
    : undefined;
  const { data: otherUser } = useQuery({
    queryKey: ['user', other],
    queryFn: () => usersApi.get(other!),
    enabled: !!other,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['conversations'] });

  useEffect(() => {
    messagingApi.markRead(conversation.id, user!.id).then(() => invalidate());
  }, [conversation.id, conversation.messages.length]);

  const sendMutation = useMutation({
    mutationFn: () => messagingApi.sendMessage(conversation.id, user!.id, message.trim()),
    onSuccess: () => { setMessage(''); invalidate(); },
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conversationId: string };
      if (detail.conversationId !== conversation.id) {
        invalidate(); return;
      }
      setIsTyping(true);
      setTimeout(() => { setIsTyping(false); invalidate(); }, 2000);
    };
    window.addEventListener('mock-db-message', handler as EventListener);
    return () => window.removeEventListener('mock-db-message', handler as EventListener);
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation.messages.length, isTyping]);

  const displayName = conversation.type === 'GROUP'
    ? conversation.name ?? 'Group chat'
    : otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Member';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b px-3 py-2.5 sm:px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 lg:hidden" onClick={onBack} aria-label="Back to conversations">
          <X className="h-4 w-4" />
        </Button>
        {conversation.type === 'DIRECT' ? (
          <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => other && navigate('profile', { id: other })}>
            <UserAvatar user={otherUser} size="md" online />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold hover:underline">{displayName}</p>
              <p className="text-[11px] text-emerald-600">online</p>
            </div>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Hash className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">{conversation.participantIds.length} participants</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
          title="Delete conversation" aria-label="Delete conversation"
          onClick={async () => {
            await messagingApi.deleteConversation(conversation.id);
            invalidate();
            toast.success('Conversation deleted.');
            onBack();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto custom-scrollbar bg-muted/20 px-3 py-4 sm:px-4">
        {conversation.messages.map(msg => {
          const mine = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <p className="mb-1 px-1 text-[10px] text-muted-foreground">
                {mine ? 'You' : msg.senderId === other ? displayName : 'Member'} · {timeAgo(msg.createdAt)}
              </p>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[65%]',
                mine ? 'rounded-br-sm text-white' : 'rounded-bl-sm border bg-background'
              )} style={mine ? { backgroundColor: 'var(--org-primary)' } : undefined}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] text-muted-foreground">{displayName.split(' ')[0]} is typing…</span>
            <div className="flex items-center gap-1 rounded-full border bg-background px-3 py-2 shadow-sm">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form className="flex items-center gap-2 border-t p-3" onSubmit={e => { e.preventDefault(); if (message.trim()) sendMutation.mutate(); }}>
        <Input value={message} onChange={e => setMessage(e.target.value)} placeholder={`Message ${displayName.split(' ')[0]}…`} />
        <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending} aria-label="Send message">
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

// ---------------- Conversations list ----------------
export function MessagingView({ peerId }: { peerId?: string }) {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'unread' | 'name'>('recent');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const bootstrappedRef = useRef(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => messagingApi.conversations(org!.id, user!.id),
    enabled: !!user?.id && !!org,
    refetchInterval: 6000,
  });

  // Deep-link: open direct conversation with peerId (from "Message" buttons)
  useEffect(() => {
    if (peerId && !bootstrappedRef.current) {
      bootstrappedRef.current = true;
      (async () => {
        const existing = conversations.find(c => c.type === 'DIRECT' && c.participantIds.includes(peerId));
        if (existing) { setActiveId(existing.id); return; }
        const u = await usersApi.get(peerId);
        if (u) {
          const conv = await messagingApi.startDirect(org!.id, user!.id, peerId, `Hi ${u.firstName} — reaching out from the community.`);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          setActiveId(conv.id);
        }
      })();
    }
  }, [peerId, conversations.length]);

  const lastMessage = (c: Conversation) => c.messages[c.messages.length - 1];
  const unreadFor = (c: Conversation) => {
    const last = lastMessage(c);
    if (!last || last.senderId === user?.id) return 0;
    return (c.readBy[user?.id ?? ''] === last.id) ? 0 : 1;
  };

  const myId = user?.id;
  const sorted = useMemo(() => {
    let list = [...conversations];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const name = c.type === 'GROUP' ? c.name ?? '' : '';
        const last = c.messages[c.messages.length - 1]?.content ?? '';
        return name.toLowerCase().includes(q) || last.toLowerCase().includes(q);
      });
    }
    if (sort === 'unread') list = list.filter(c => {
      const last = c.messages[c.messages.length - 1];
      if (!last || last.senderId === myId) return false;
      return (c.readBy[myId ?? ''] !== last.id);
    });
    if (sort === 'name') list = list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return list;
  }, [conversations, search, sort, myId]);

  const active = conversations.find(c => c.id === activeId);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-4 hidden items-center justify-between lg:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messaging</h1>
          <p className="text-sm text-muted-foreground">Direct chats and group conversations with your connections.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setNewOpen(true)}><MessageSquarePlus className="h-4 w-4" /> New message</Button>
      </div>

      <div className="grid h-[calc(100vh-12rem)] min-h-[32rem] overflow-hidden rounded-xl border bg-card shadow-sm lg:grid-cols-[22rem_1fr]">
        {/* Conversation list */}
        <div className={cn('flex min-h-0 flex-col border-r', active && 'hidden lg:flex')}>
          <div className="space-y-2 border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats…" className="h-9 pl-9" />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              {(['recent', 'unread', 'name'] as const).map(s => (
                <button
                  key={s} onClick={() => setSort(s)}
                  className={cn('rounded-full px-2.5 py-1 font-medium capitalize transition-colors', sort === s ? 'bg-org-primary text-white' : 'text-muted-foreground hover:bg-muted')}
                  style={sort === s ? { backgroundColor: 'var(--org-primary)' } : undefined}
                >
                  {s === 'unread' ? 'Unread first' : s === 'name' ? 'A–Z' : 'Recent'}
                </button>
              ))}
              <Button size="sm" variant="outline" className="ml-auto h-6 gap-1 px-2 text-[11px] lg:hidden" onClick={() => setNewOpen(true)}>
                <MessageSquarePlus className="h-3 w-3" /> New
              </Button>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : sorted.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">No conversations{search ? ' match your search' : ' yet'}.</p>
            ) : (
              sorted.map(c => {
                const last = lastMessage(c);
                const unread = unreadFor(c);
                const other = c.type === 'DIRECT' ? c.participantIds.find(p => p !== user?.id) : undefined;
                return (
                  <ConversationRow
                    key={c.id} conversation={c} otherId={other} lastPreview={last?.content ?? 'No messages yet'}
                    lastAt={last?.createdAt ?? c.createdAt} unread={unread} active={c.id === activeId}
                    onSelect={() => { setActiveId(c.id); queryClient.invalidateQueries({ queryKey: ['conversations'] }); }}
                  />
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* Chat pane */}
        {active ? (
          <ChatView conversation={active} onBack={() => setActiveId(null)} />
        ) : (
          <div className="hidden flex-col items-center justify-center gap-3 p-8 text-center lg:flex">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">Your conversations</p>
            <p className="max-w-xs text-xs text-muted-foreground">Select a chat to start messaging, or begin a new conversation with one of your connections.</p>
            <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}><MessageSquarePlus className="h-3.5 w-3.5" /> New message</Button>
          </div>
        )}
      </div>

      <NewMessageDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function ConversationRow({ conversation, otherId, lastPreview, lastAt, unread, active, onSelect }: {
  conversation: Conversation; otherId?: string; lastPreview: string; lastAt: string; unread: number; active: boolean; onSelect: () => void;
}) {
  const { data: otherUser } = useQuery({
    queryKey: ['user', otherId],
    queryFn: () => usersApi.get(otherId!),
    enabled: !!otherId,
    staleTime: 60_000,
  });
  const name = conversation.type === 'GROUP'
    ? conversation.name ?? 'Group chat'
    : otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Member';

  return (
    <button
      onClick={onSelect}
      className={cn('flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/50', active && 'bg-muted/70')}
    >
      {conversation.type === 'DIRECT' ? (
        <UserAvatar user={otherUser} size="md" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Hash className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('truncate text-sm', unread ? 'font-bold' : 'font-medium')}>{name}</p>
          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(lastAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn('truncate text-xs', unread ? 'font-medium text-foreground' : 'text-muted-foreground')}>{lastPreview}</p>
          {unread > 0 && <Badge className="h-4 min-w-4 shrink-0 px-1 text-[9px]">New</Badge>}
        </div>
      </div>
    </button>
  );
}
