'use client';

// ============================================================
// Admin deal rooms + support inbox
// ============================================================
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Briefcase, CheckCircle2, Clock, Inbox, Loader2, Lock, Search, ShieldCheck, Trash2, TrendingUp, Unlock, Users, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dealRoomsApi, supportApi, usersApi } from '@/lib/db/client';
import type { SupportTicket } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { UserAvatar } from '@/components/shared/user-avatar';
import { StatCard, EmptyState } from '@/components/shared/primitives';
import { timeAgo } from '@/lib/format';

// ---------------- Deal rooms admin ----------------
export function AdminDealRoomsView() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin-dealrooms', org?.id],
    queryFn: () => dealRoomsApi.listAdmin(org!.id),
    enabled: !!org,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dealrooms'] });
    queryClient.invalidateQueries({ queryKey: ['deal-rooms'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' | 'lock' | 'unlock' | 'delete' }) => dealRoomsApi.setStatus(id, action),
    onSuccess: (_d, { action }) => {
      invalidate();
      const messages: Record<string, string> = { approve: 'Deal room approved.', reject: 'Deal room rejected.', lock: 'Deal room locked.', unlock: 'Deal room unlocked.', delete: 'Deal room deleted.' };
      toast.success(messages[action]);
    },
  });

  const filtered = rooms.filter(r => !search.trim() || r.roomName.toLowerCase().includes(search.toLowerCase()));
  const active = filtered.filter(r => r.status === 'ACTIVE' && r.isActive);
  const pending = filtered.filter(r => r.status === 'PENDING_APPROVAL');
  const locked = filtered.filter(r => !r.isActive);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Rooms</h1>
          <p className="text-sm text-muted-foreground">Approve new rooms, monitor activity and lock rooms if needed.</p>
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…" className="pl-9" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard title="Active rooms" value={rooms.filter(r => r.isActive && r.status === 'ACTIVE').length} icon={TrendingUp} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" />
        <StatCard title="Total members" value={rooms.reduce((n, r) => n + r.members.length, 0)} icon={Users} iconClassName="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" />
        <StatCard title="Pending review" value={pending.length} icon={Clock} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" highlight={pending.length > 0} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="active" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Active ({active.length})</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="locked" className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Locked ({locked.length})</TabsTrigger>
          </TabsList>

          {(['active', 'pending', 'locked'] as const).map(tabKey => {
            const list = tabKey === 'active' ? active : tabKey === 'pending' ? pending : locked;
            return (
              <TabsContent key={tabKey} value={tabKey}>
                {list.length === 0 ? (
                  <EmptyState icon={Briefcase} title={`No ${tabKey} deal rooms`} />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {list.map(room => (
                      <Card key={room.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
                                <Briefcase className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">{room.roomName}</p>
                                <p className="truncate text-xs text-muted-foreground">{room.members.length} members · {room.files.length} documents · {room.messages.length} messages</p>
                              </div>
                            </div>
                            {room.status === 'PENDING_APPROVAL'
                              ? <Badge variant="secondary" className="gap-1 text-amber-600"><Clock className="h-3 w-3" /> Pending</Badge>
                              : room.isActive
                                ? <Badge variant="secondary" className="gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                                : <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>}
                          </div>
                          {room.roomDescription && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{room.roomDescription}</p>}
                          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                            {room.status === 'PENDING_APPROVAL' ? (
                              <>
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-600" onClick={() => statusMutation.mutate({ id: room.id, action: 'approve' })}><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive" onClick={() => statusMutation.mutate({ id: room.id, action: 'reject' })}><XCircle className="h-3 w-3" /> Reject</Button>
                              </>
                            ) : room.isActive ? (
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-amber-600" onClick={() => statusMutation.mutate({ id: room.id, action: 'lock' })}><Lock className="h-3 w-3" /> Lock room</Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-600" onClick={() => statusMutation.mutate({ id: room.id, action: 'unlock' })}><Unlock className="h-3 w-3" /> Unlock</Button>
                            )}
                            <Button size="sm" variant="ghost" className="ml-auto h-7 text-destructive" onClick={() => statusMutation.mutate({ id: room.id, action: 'delete' })} aria-label="Delete room">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

// ---------------- Support inbox ----------------
export function AdminSupportView() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'UNREAD' | 'READ' | 'RESOLVED'>('all');
  const [search, setSearch] = useState('');
  const [reading, setReading] = useState<SupportTicket | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', org?.id],
    queryFn: () => supportApi.listByOrg(org!.id),
    enabled: !!org,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['support-tickets'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicket['status'] }) => supportApi.setStatus(id, status),
    onSuccess: (_d, { status }) => { invalidate(); toast.success(`Ticket marked ${status.toLowerCase()}.`); },
  });

  const filtered = tickets
    .filter(t => filter === 'all' ? true : t.status === filter)
    .filter(t => !search.trim() || t.subject.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    unread: tickets.filter(t => t.status === 'UNREAD').length,
    read: tickets.filter(t => t.status === 'READ').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Support Inbox</h1>
        <p className="text-sm text-muted-foreground">Member support requests routed to your organization&apos;s admin team.</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard title="Unread" value={counts.unread} icon={Inbox} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" highlight={counts.unread > 0} />
        <StatCard title="In progress" value={counts.read} icon={Clock} iconClassName="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" />
        <StatCard title="Resolved" value={counts.resolved} icon={CheckCircle2} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…" className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {([['all', 'All'], ['UNREAD', 'Unread'], ['READ', 'In progress'], ['RESOLVED', 'Resolved']] as const).map(([v, label]) => (
            <button
              key={v} onClick={() => setFilter(v as typeof filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filter === v ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
              style={filter === v ? { backgroundColor: 'var(--org-primary)' } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No support tickets" description="Member requests will land here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setReading(t)}>
                    <TableCell>
                      <TicketSender userId={t.userId} />
                    </TableCell>
                    <TableCell className="max-w-xs"><p className="truncate text-sm font-medium">{t.subject}</p></TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{timeAgo(t.createdAt)}</TableCell>
                    <TableCell>
                      {t.status === 'UNREAD' && <Badge variant="secondary" className="gap-1 text-amber-600"><Inbox className="h-3 w-3" /> Unread</Badge>}
                      {t.status === 'READ' && <Badge variant="secondary" className="gap-1 text-indigo-600"><Clock className="h-3 w-3" /> In progress</Badge>}
                      {t.status === 'RESOLVED' && <Badge variant="secondary" className="gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Resolved</Badge>}
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      {t.status !== 'RESOLVED' ? (
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-600" onClick={() => statusMutation.mutate({ id: t.id, status: 'RESOLVED' })}>
                          <CheckCircle2 className="h-3 w-3" /> Resolve
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => statusMutation.mutate({ id: t.id, status: 'UNREAD' })}>
                          <Inbox className="h-3 w-3" /> Reopen
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ticket detail */}
      {reading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setReading(null)}>
          <Card className="w-full max-w-lg shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <TicketSender userId={reading.userId} size="md" />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReading(null)} aria-label="Close ticket">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
                <p className="mt-1 text-sm font-bold">{reading.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
                <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm leading-relaxed custom-scrollbar">{reading.message}</p>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted-foreground">Submitted {timeAgo(reading.createdAt)}</span>
                <div className="flex gap-2">
                  {reading.status !== 'RESOLVED' && (
                    <Button size="sm" onClick={() => { statusMutation.mutate({ id: reading.id, status: 'RESOLVED' }); setReading(null); }}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TicketSender({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const { data: u } = useQuery({ queryKey: ['user', userId], queryFn: () => usersApi.get(userId) });
  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar user={u} size={size} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{u ? `${u.firstName} ${u.lastName}` : 'Member'}</p>
        <p className="truncate text-[11px] text-muted-foreground">{u?.email}</p>
      </div>
    </div>
  );
}
