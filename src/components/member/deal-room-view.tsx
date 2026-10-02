'use client';

// ============================================================
// Deal Room — list + room view with NDA gate, chat, documents
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Check, Download, FileText, Loader2, Lock, MessageSquare, Plus, Search, Send, ShieldCheck, Upload, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { connectionsApi, dealRoomsApi, usersApi } from '@/lib/db/client';
import type { DealRoom, User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';
import { cn, formatBytes, timeAgo } from '@/lib/format';

const NDA_CLAUSES = [
  'All information shared within this deal room — including documents, messages, financial data and member identities — is strictly confidential.',
  'Information may only be used for evaluating the investment or partnership under discussion.',
  'Information must not be shared outside the room\'s signed members without written consent from the room owner.',
  'Upon conclusion of discussions, confidential materials should be deleted from your systems.',
  'This agreement is governed by the community\'s master terms and applicable local law.',
];

// ---------------- Create room modal ----------------
function CreateDealRoomDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

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

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const mutation = useMutation({
    mutationFn: () => dealRoomsApi.create({ orgId: org!.id, createdBy: user!.id, roomName: name, roomDescription: description, memberIds: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-rooms'] });
      onOpenChange(false); setName(''); setDescription(''); setSelected([]);
      toast.success('Deal room created — NDA required before members can view content.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New deal room</DialogTitle>
          <DialogDescription>A private space for co-investment and partnership discussions. Members must sign the NDA before accessing content.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Room name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Series B Syndicate — FinCo" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What is being discussed or offered?" />
          </div>
          <div className="space-y-2">
            <Label>Invite members ({selected.length})</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto custom-scrollbar rounded-lg border p-2">
              {candidates.length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">No connections available yet — connect with members first.</p>}
              {candidates.map(c => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/50">
                  <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                  <UserAvatar user={c} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{c.firstName} {c.lastName}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{c.profile?.title ?? 'Member'}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- NDA overlay ----------------
function NdaOverlay({ room, onSigned }: { room: DealRoom; onSigned: () => void }) {
  const { user } = useApp();
  const [agreed, setAgreed] = useState(false);
  const mutation = useMutation({
    mutationFn: () => dealRoomsApi.signNda(room.id, user!.id),
    onSuccess: () => { onSigned(); toast.success('NDA signed — audit trail updated. You now have full room access.'); },
  });

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <CardTitle>Non-Disclosure Agreement required</CardTitle>
          <CardDescription>
            {room.roomName} contains confidential materials. Please review and accept the NDA to continue. Your signature is timestamped in the room audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-44 rounded-lg border bg-muted/30 p-4">
            <ul className="list-disc space-y-2.5 pl-4 text-xs leading-relaxed text-muted-foreground">
              {NDA_CLAUSES.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </ScrollArea>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
            <Checkbox checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5" />
            <span className="text-xs leading-relaxed">
              I have read and accept the terms of this Non-Disclosure Agreement. I understand my activity in this room is logged.
            </span>
          </label>
          <Button className="w-full" size="lg" disabled={!agreed || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign NDA & enter room</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Room view ----------------
function DealRoomView({ roomId, onBack }: { roomId: string; onBack: () => void }) {
  const { user } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: room } = useQuery({
    queryKey: ['deal-room', roomId],
    queryFn: () => dealRoomsApi.get(roomId),
    enabled: !!roomId,
    refetchInterval: 5000,
  });
  const { data: memberUsers = {} } = useQuery({
    queryKey: ['deal-room-members', roomId],
    queryFn: async () => {
      const users = await Promise.all((room?.members ?? []).map(m => usersApi.get(m.userId)));
      return Object.fromEntries(users.filter(Boolean).map(u => [u!.id, u])) as Record<string, User>;
    },
    enabled: !!room,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['deal-room', roomId] });

  const sendMutation = useMutation({
    mutationFn: () => dealRoomsApi.sendMessage(roomId, user!.id, message.trim()),
    onSuccess: () => { setMessage(''); invalidate(); },
  });

  // Simulated typing indicator before the canned reply lands
  useEffect(() => {
    const handler = () => {
      setIsTyping(true);
      setTimeout(() => { setIsTyping(false); invalidate(); }, 2500);
    };
    window.addEventListener('mock-db-message', handler as EventListener);
    return () => window.removeEventListener('mock-db-message', handler as EventListener);
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [room?.messages.length, isTyping]);

  if (!room) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const myMember = room.members.find(m => m.userId === user?.id);
  const ndaSigned = !!myMember?.ndaSigned;
  const others = room.members.filter(m => m.userId !== user?.id);

  return (
    <div className="relative flex h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 lg:hidden" onClick={onBack} aria-label="Back to rooms">
          <X className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold">{room.roomName}</p>
            <Badge variant={room.isActive ? 'secondary' : 'destructive'} className="gap-1 shrink-0">
              {room.isActive ? <><Check className="h-3 w-3" /> Active</> : <><Lock className="h-3 w-3" /> Locked</>}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{room.members.length} members · NDA required · audit trail active</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowMembers(true)}><Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Members</span></Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowDocs(true)}><FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Documents</span> <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px]">{room.files.length}</Badge></Button>
      </div>

      {/* Content */}
      {!ndaSigned ? (
        <NdaOverlay room={room} onSigned={invalidate} />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Description */}
        {room.roomDescription && (
          <div className="border-b bg-muted/30 px-4 py-2.5">
            <p className="line-clamp-2 text-xs text-muted-foreground">{room.roomDescription}</p>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto custom-scrollbar px-4 py-4">
          {room.messages.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No messages yet — open the discussion.</p>
          )}
          {room.messages.map(msg => {
            const mine = msg.senderId === user?.id;
            const sender = memberUsers[msg.senderId];
            return (
              <div key={msg.id} className={cn('flex items-end gap-2.5', mine && 'flex-row-reverse')}>
                {!mine && <UserAvatar user={sender} size="sm" />}
                <div className={cn('max-w-[75%] sm:max-w-[60%]', mine && 'text-right')}>
                  <p className="mb-1 text-[10px] text-muted-foreground">
                    {mine ? 'You' : sender ? `${sender.firstName} ${sender.lastName}` : 'Member'} · {timeAgo(msg.createdAt)}
                  </p>
                  <div className={cn(
                    'inline-block rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed shadow-sm',
                    mine ? 'rounded-br-sm bg-org-primary text-white' : 'rounded-bl-sm border bg-background'
                  )} style={mine ? { backgroundColor: 'var(--org-primary)' } : undefined}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-center gap-2.5">
              <UserAvatar user={others[0] ? memberUsers[others[0].userId] : null} size="sm" />
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border bg-background px-3.5 py-3 shadow-sm">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-3">
          <form
            className="flex items-center gap-2"
            onSubmit={e => { e.preventDefault(); if (message.trim()) sendMutation.mutate(); }}
          >
            <Input
              value={message} onChange={e => setMessage(e.target.value)}
              placeholder={ndaSigned ? 'Message the room…' : 'Sign the NDA to participate'}
              disabled={!ndaSigned || !room.isActive}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || !ndaSigned || sendMutation.isPending} aria-label="Send message">
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Members modal */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Room members ({room.members.length})</DialogTitle>
            <DialogDescription>Only NDA-signed members can view documents and participate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {room.members.map(m => {
              const u = memberUsers[m.userId];
              return (
                <div key={m.userId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                  <UserAvatar user={u} size="sm" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => { setShowMembers(false); navigate('profile', { id: m.userId }); }}>
                    <p className="truncate text-sm font-medium">{u ? `${u.firstName} ${u.lastName}` : 'Member'}</p>
                    <p className="truncate text-xs text-muted-foreground">{u?.email}</p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {m.role === 'OWNER' && <Badge>Owner</Badge>}
                    {m.ndaSigned
                      ? <Badge variant="secondary" className="gap-1 text-emerald-600"><Check className="h-3 w-3" /> NDA</Badge>
                      : <Badge variant="outline" className="gap-1 text-amber-600"><ShieldCheck className="h-3 w-3" /> Pending</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents modal */}
      <Dialog open={showDocs} onOpenChange={setShowDocs}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Data room ({room.files.length})</DialogTitle>
            <DialogDescription>Pitch decks, financials and legal agreements. Access is logged.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            {room.files.map(f => (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)} · {memberUsers[f.uploadedBy]?.firstName ?? 'Member'} · {timeAgo(f.createdAt)}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info('Secure download logged (mock).')}>
                  <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            ))}
            {room.files.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No documents uploaded yet.</p>}
          </div>
          <div className="border-t pt-3">
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                await dealRoomsApi.uploadFile(roomId, { name: file.name, size: file.size }, user!.id);
                invalidate();
                toast.success('Document uploaded — audit trail updated.');
                e.currentTarget.value = '';
              }} />
              <span className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                <Upload className="h-4 w-4" /> Upload document (mock)
              </span>
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- List ----------------
export function DealRoomsView({ roomId }: { roomId?: string }) {
  const { user, org } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['deal-rooms', user?.id],
    queryFn: () => dealRoomsApi.list(org!.id, user!.id),
    enabled: !!user?.id && !!org,
  });

  if (roomId) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <DealRoomView roomId={roomId} onBack={() => navigate('deal-room')} />
      </div>
    );
  }

  const filtered = rooms
    .filter(r => !search.trim() || r.roomName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Room</h1>
          <p className="text-sm text-muted-foreground">Secure co-investment and collaboration rooms with NDA gating.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New deal room</Button>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…" className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No deal rooms yet" description="Create a room to start a confidential investment or partnership discussion." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(room => {
            const myMember = room.members.find(m => m.userId === user?.id);
            return (
              <Card key={room.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate('deal-room', { id: room.id })}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{room.roomName}</p>
                        <p className="truncate text-xs text-muted-foreground">{room.members.length} members · {room.files.length} documents</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={room.isActive ? 'secondary' : 'destructive'} className="gap-1">
                        {room.isActive ? <><Check className="h-3 w-3" /> Active</> : <><Lock className="h-3 w-3" /> Locked</>}
                      </Badge>
                      {!myMember?.ndaSigned && <Badge variant="outline" className="gap-1 text-amber-600"><ShieldCheck className="h-3 w-3" /> NDA pending</Badge>}
                    </div>
                  </div>
                  {room.roomDescription && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{room.roomDescription}</p>}
                  {room.messages.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="truncate">{room.messages[room.messages.length - 1].content.slice(0, 80)}</span>
                      <span className="ml-auto shrink-0">{timeAgo(room.messages[room.messages.length - 1].createdAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateDealRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
