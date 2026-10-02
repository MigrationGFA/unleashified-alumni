'use client';

// ============================================================
// Admin groups management (ported from stp-admin groups.tsx)
// ============================================================
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Loader2, Lock, Search, ShieldCheck, Unlock, Users, UsersRound, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { groupsApi, usersApi } from '@/lib/db/client';
import type { Group } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { EmptyState } from '@/components/shared/primitives';
import { formatDate } from '@/lib/format';

export function AdminGroupsView() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Group | null>(null);
  const [lockFor, setLockFor] = useState<Group | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [rejectFor, setRejectFor] = useState<Group | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin-groups', org?.id],
    queryFn: () => groupsApi.listAdmin(org!.id),
    enabled: !!org,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => groupsApi.approve(id, action, reason),
    onSuccess: (_d, { action }) => { invalidate(); toast.success(action === 'approve' ? 'Group approved.' : 'Group rejected.'); },
  });
  const lockMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: Group['status']; reason?: string }) => groupsApi.setStatus(id, status, reason),
    onSuccess: (_d, { status }) => { invalidate(); toast.success(status === 'LOCKED' ? 'Group locked.' : 'Group unlocked.'); },
  });

  const filtered = (list: Group[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(g => g.name.toLowerCase().includes(q));
  };

  const active = filtered(groups.filter(g => g.status === 'ACTIVE'));
  const pending = filtered(groups.filter(g => g.status === 'PENDING_APPROVAL'));
  const locked = filtered(groups.filter(g => g.status === 'LOCKED'));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">Approve new groups, manage members and lock groups on report.</p>
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…" className="pl-9" />
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-1.5"><UsersRound className="h-3.5 w-3.5" /> All ({active.length})</TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="locked" className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Locked ({locked.length})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <TabsContent value="active">
              {active.length === 0 ? <EmptyState icon={UsersRound} title="No active groups" /> : (
                <GroupTable groups={active} onView={setDetail} actions={g => (
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-amber-600" onClick={() => { setLockFor(g); setLockReason(''); }}>
                    <Lock className="h-3 w-3" /> Lock
                  </Button>
                )} />
              )}
            </TabsContent>

            <TabsContent value="pending">
              {pending.length === 0 ? <EmptyState icon={ShieldCheck} title="No pending groups" description="Member-submitted groups await approval here." /> : (
                <GroupTable groups={pending} onView={setDetail} actions={g => (
                  <>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-600" onClick={() => approveMutation.mutate({ id: g.id, action: 'approve' })}>
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive" onClick={() => { setRejectFor(g); setRejectReason(''); }}>
                      <XCircle className="h-3 w-3" /> Reject
                    </Button>
                  </>
                )} />
              )}
            </TabsContent>

            <TabsContent value="locked">
              {locked.length === 0 ? <EmptyState icon={Lock} title="No locked groups" /> : (
                <GroupTable groups={locked} onView={setDetail} actions={g => (
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-600" onClick={() => lockMutation.mutate({ id: g.id, status: 'ACTIVE' })}>
                    <Unlock className="h-3 w-3" /> Unlock
                  </Button>
                )} />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{detail?.name}</DialogTitle>
            <DialogDescription>{detail?.members.length} members · created {detail ? formatDate(detail.createdAt) : ''}</DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <p className="text-sm leading-relaxed">{detail.description}</p>
              <div className="max-h-48 space-y-1 overflow-y-auto custom-scrollbar">
                {detail.members.map(m => <MemberRow key={m.userId} userId={m.userId} role={m.memberRole} />)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lock dialog */}
      <Dialog open={!!lockFor} onOpenChange={v => !v && setLockFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Lock “{lockFor?.name}”?</DialogTitle>
            <DialogDescription>Members will lose access to the group feed until it is unlocked.</DialogDescription>
          </DialogHeader>
          <Textarea value={lockReason} onChange={e => setLockReason(e.target.value)} rows={2} placeholder="Reason for locking (recorded)…" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLockFor(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!lockReason.trim()} onClick={() => { lockMutation.mutate({ id: lockFor!.id, status: 'LOCKED', reason: lockReason }); setLockFor(null); }}>
              Lock group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectFor} onOpenChange={v => !v && setRejectFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject “{rejectFor?.name}”?</DialogTitle>
            <DialogDescription>The creator will see this group rejected in their list.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="Reason for rejection (required)…" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim()} onClick={() => { approveMutation.mutate({ id: rejectFor!.id, action: 'reject', reason: rejectReason }); setRejectFor(null); }}>
              Reject group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupTable({ groups, onView, actions }: { groups: Group[]; onView: (g: Group) => void; actions?: (g: Group) => React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead className="hidden md:table-cell">Privacy</TableHead>
              <TableHead className="hidden sm:table-cell">Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(g => (
              <TableRow key={g.id}>
                <TableCell>
                  <button className="text-left" onClick={() => onView(g)}>
                    <p className="flex items-center gap-1.5 text-sm font-medium hover:underline">
                      {g.status === 'PENDING_APPROVAL' && <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />}
                      {g.name}
                    </p>
                    <p className="line-clamp-1 max-w-xs text-[11px] text-muted-foreground">{g.description}</p>
                  </button>
                </TableCell>
                <TableCell className="hidden text-xs md:table-cell">{g.privacyMode === 'CLOSED' ? 'Private' : 'Public'}</TableCell>
                <TableCell className="hidden text-xs tabular-nums sm:table-cell">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" /> {g.members.length}</span>
                </TableCell>
                <TableCell>
                  {g.status === 'ACTIVE' && <Badge variant="secondary" className="gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Active</Badge>}
                  {g.status === 'PENDING_APPROVAL' && <Badge variant="secondary" className="gap-1 text-amber-600"><ShieldCheck className="h-3 w-3" /> Pending</Badge>}
                  {g.status === 'LOCKED' && <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>}
                  {g.reportReason && <p className="mt-1 flex items-center gap-1 text-[10px] text-destructive"><AlertCircle className="h-3 w-3" /> {g.reportReason}</p>}
                </TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-1.5">{actions?.(g)}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MemberRow({ userId, role }: { userId: string; role: 'ADMIN' | 'MEMBER' }) {
  const { data: u } = useQuery({ queryKey: ['user', userId], queryFn: () => usersApi.get(userId) });
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-xs font-medium">{u ? `${u.firstName} ${u.lastName}` : 'Member'}</span>
      {role === 'ADMIN' && <Badge className="text-[10px]">Group admin</Badge>}
    </div>
  );
}
