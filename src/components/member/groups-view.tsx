'use client';

// ============================================================
// Groups — discover, my groups + group detail with feed
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Hash, Loader2, Lock, Plus, Search, ShieldCheck, UserMinus, Users, UsersRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { groupsApi, postsApi, usersApi } from '@/lib/db/client';
import type { Group, User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { PostCard, CreatePostComposer } from '@/components/member/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';
import { timeAgo } from '@/lib/format';

// ---------------- Browse ----------------
function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'CLOSED'>('PUBLIC');

  const mutation = useMutation({
    mutationFn: () => groupsApi.create({ orgId: org!.id, createdBy: user!.id, name, description, privacyMode: privacy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onOpenChange(false); setName(''); setDescription('');
      toast.success(`Group created — you are the group admin.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
          <DialogDescription>Interest, regional or industry groups help members self-organize.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Group name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="e.g. HealthTech Founders" />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} minLength={10} placeholder="What will this group do?" />
          </div>
          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select value={privacy} onValueChange={v => setPrivacy(v as 'PUBLIC' | 'CLOSED')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public — anyone can join instantly</SelectItem>
                <SelectItem value="CLOSED">Private — join requests need admin approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name.trim() || description.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={onOpen}>
      <div className="relative h-24">
        {group.coverImage ? (
           
          <img src={group.coverImage} alt={group.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-org-secondary to-org-primary text-white">
            <Hash className="h-7 w-7 opacity-70" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <p className="truncate text-sm font-bold text-white drop-shadow">{group.name}</p>
          <Badge variant="secondary" className="bg-white/90 text-gray-900">{group.privacyMode === 'CLOSED' ? 'Private' : 'Public'}</Badge>
        </div>
      </div>
      <CardContent className="p-3.5">
        <p className="line-clamp-2 text-xs text-muted-foreground">{group.description}</p>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {group.members.length} members</span>
          <span>Created {timeAgo(group.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function GroupsView() {
  const { user, org } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups', org?.id],
    queryFn: () => groupsApi.list(org!.id),
    enabled: !!org,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
  }, [groups, search]);

  const myGroups = filtered.filter(g => g.members.some(m => m.userId === user?.id));
  const discover = filtered.filter(g => !g.members.some(m => m.userId === user?.id));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community Groups</h1>
          <p className="text-sm text-muted-foreground">Interest-based, regional and industry groups in your community.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…" className="pl-9" />
          </div>
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-8">
          {myGroups.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><UsersRound className="h-4 w-4 text-org-primary" /> My groups ({myGroups.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {myGroups.map(g => <GroupCard key={g.id} group={g} onOpen={() => navigate('group', { id: g.id })} />)}
              </div>
            </section>
          )}
          {discover.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Hash className="h-4 w-4 text-org-accent" /> Discover groups ({discover.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {discover.map(g => <GroupCard key={g.id} group={g} onOpen={() => navigate('group', { id: g.id })} />)}
              </div>
            </section>
          )}
          {filtered.length === 0 && (
            <EmptyState icon={UsersRound} title="No groups found" description="Try a different search, or create the group your community is missing." />
          )}
        </div>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ---------------- Group detail ----------------
export function GroupDetailView({ groupId }: { groupId: string }) {
  const { user } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const queryClient = useQueryClient();
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.get(groupId),
    enabled: !!groupId,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: () => postsApi.listGroupPosts(groupId),
    enabled: !!groupId,
  });
  const { data: memberUsers = {} } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const users = await Promise.all((group?.members ?? []).map(m => usersApi.get(m.userId)));
      return Object.fromEntries(users.filter(Boolean).map(u => [u!.id, u])) as Record<string, User>;
    },
    enabled: !!group,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['group'] });
    queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['group-members'] });
  };

  const joinMutation = useMutation({
    mutationFn: () => groupsApi.join(groupId, user!.id),
    onSuccess: (g) => {
      invalidate();
      toast[g.privacyMode === 'CLOSED' ? 'info' : 'success'](g.privacyMode === 'CLOSED' ? 'Join request sent to group admins.' : 'Joined — welcome to the group!');
    },
  });
  const leaveMutation = useMutation({
    mutationFn: () => groupsApi.leave(groupId, user!.id),
    onSuccess: () => { invalidate(); toast.success('You left the group.'); },
  });
  const respondRequestMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) => groupsApi.respondJoinRequest(groupId, requestId, action),
    onSuccess: (_d, { action }) => { invalidate(); toast.success(action === 'approve' ? 'Member approved.' : 'Request rejected.'); },
  });

  if (!group) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const myMembership = group.members.find(m => m.userId === user?.id);
  const isGroupAdmin = myMembership?.memberRole === 'ADMIN' || user?.role === 'ADMIN';
  const pendingRequests = group.joinRequests;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <button onClick={() => navigate('groups')} className="mb-4 text-sm font-medium text-muted-foreground hover:text-foreground">
        ← All groups
      </button>

      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl">
        {group.coverImage ? (
           
          <img src={group.coverImage} alt={group.name} className="h-40 w-full object-cover sm:h-48" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-org-secondary to-org-primary text-white sm:h-48">
            <Hash className="h-10 w-10 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold text-white drop-shadow sm:text-2xl">{group.name}</h1>
              {group.privacyMode === 'CLOSED' && <Badge variant="secondary" className="gap-1 bg-white/90 text-gray-900"><Lock className="h-3 w-3" /> Private</Badge>}
            </div>
            <p className="mt-1 text-xs text-white/80">{group.members.length} members · created {timeAgo(group.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            {myMembership ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowMembers(true)}><Users className="mr-1.5 h-3.5 w-3.5" /> Members</Button>
                {isGroupAdmin && pendingRequests.length > 0 && (
                  <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setShowRequests(true)}>
                    <ShieldCheck className="h-3.5 w-3.5" /> Requests <Badge className="h-4 min-w-4 px-1 text-[9px]">{pendingRequests.length}</Badge>
                  </Button>
                )}
                {!isGroupAdmin && (
                  <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
                    <UserMinus className="mr-1.5 h-3.5 w-3.5" /> Leave
                  </Button>
                )}
              </>
            ) : (
              <Button size="sm" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : group.privacyMode === 'CLOSED' ? 'Request to join' : 'Join group'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{group.description}</p>

      {/* Feed */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold">Discussion</h2>
        {myMembership && <CreatePostComposer groupId={groupId} placeholder="Share something with the group…" />}
        {posts.length === 0 ? (
          <EmptyState icon={UsersRound} title="No group posts yet" description={myMembership ? 'Start the first discussion above.' : 'Join the group to participate in discussions.'} />
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onNavigateToProfile={userId => navigate('profile', { id: userId })} />)
        )}
      </div>

      {/* Members sheet */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group members ({group.members.length})</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto custom-scrollbar">
            {group.members.map(m => {
              const u = memberUsers[m.userId];
              return (
                <div key={m.userId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                  <UserAvatar user={u} size="sm" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => { setShowMembers(false); navigate('profile', { id: m.userId }); }}>
                    <p className="truncate text-sm font-medium">{u ? `${u.firstName} ${u.lastName}` : 'Member'}</p>
                    <p className="truncate text-xs text-muted-foreground">{u?.profile?.title ?? 'Member'}</p>
                  </button>
                  {m.memberRole === 'ADMIN' && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Admin</Badge>}
                  {isGroupAdmin && m.userId !== user?.id && m.memberRole !== 'ADMIN' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Remove member" aria-label="Remove member"
                      onClick={async () => { await groupsApi.removeMember(groupId, m.userId); invalidate(); toast.success('Member removed.'); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Join requests sheet (group admins) */}
      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join requests ({pendingRequests.length})</DialogTitle>
            <DialogDescription>Approve or reject requests to join this private group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <JoinRequestRow key={req.id} requestId={req.id} userId={req.userId} onRespond={(action) => respondRequestMutation.mutate({ requestId: req.id, action })} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JoinRequestRow({ userId, onRespond }: { userId: string; requestId: string; onRespond: (action: 'approve' | 'reject') => void }) {
  const { data: u } = useQuery({ queryKey: ['user', userId], queryFn: () => usersApi.get(userId) });
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <UserAvatar user={u} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{u ? `${u.firstName} ${u.lastName}` : 'Member'}</p>
        <p className="truncate text-xs text-muted-foreground">{u?.profile?.title ?? 'Member'}</p>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => onRespond('approve')}><Check className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => onRespond('reject')}><X className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
