'use client';

// ============================================================
// Network — connections, explore, invitations
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Loader2, Mail, MessageSquare, Search, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { connectionsApi, usersApi } from '@/lib/db/client';
import type { Connection, User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';

function MemberRow({ member, actions }: { member: User; actions?: React.ReactNode }) {
  const navigate = useAppStore(s => s.navigate);
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm">
      <button onClick={() => navigate('profile', { id: member.id })} aria-label={`View ${member.firstName}'s profile`}>
        <UserAvatar user={member} size="md" />
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => navigate('profile', { id: member.id })}>
        <p className="truncate text-sm font-semibold hover:underline">{member.firstName} {member.lastName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {member.profile.title ?? 'Member'}{member.profile.companyName ? ` · ${member.profile.companyName}` : ''}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {member.profile.location && <Badge variant="outline" className="text-[10px]">{member.profile.location}</Badge>}
          {member.profile.sectors.slice(0, 1).map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
        </div>
      </button>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function NetworkView() {
  const { user, org, t } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'connections' | 'explore' | 'invitations'>('connections');
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', user?.id],
    queryFn: () => connectionsApi.network(org!.id, user!.id),
    enabled: !!user?.id && !!org,
  });
  const { data: directory = [] } = useQuery({
    queryKey: ['directory', org?.id],
    queryFn: () => usersApi.searchDirectory(org!.id, user!.id),
    enabled: !!org && !!user?.id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    queryClient.invalidateQueries({ queryKey: ['directory'] });
    queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const respondMutation = useMutation({
    mutationFn: ({ connId, action }: { connId: string; action: 'accept' | 'ignore' | 'decline' | 'remove' }) =>
      connectionsApi.respond(connId, action),
    onSuccess: (_d, { action }) => {
      invalidate();
      toast.success(action === 'accept' ? 'Connection accepted — you can now message each other.' : action === 'remove' ? 'Connection removed.' : 'Request dismissed.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const connectMutation = useMutation({
    mutationFn: (recipientId: string) => connectionsApi.connect(org!.id, user!.id, recipientId),
    onSuccess: () => { invalidate(); toast.success('Connection request sent.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusFor = (memberId: string): { conn?: Connection; status: string } => {
    const conn = connections.find(c =>
      (c.requesterId === memberId && c.recipientId === user?.id) || (c.recipientId === memberId && c.requesterId === user?.id));
    if (!conn) return { status: 'none' };
    const outgoing = conn.requesterId === user?.id;
    if (conn.status === 'ACCEPTED') return { conn, status: 'accepted' };
    if (conn.status === 'PENDING') return { conn, status: outgoing ? 'pending-out' : 'pending-in' };
    return { conn, status: 'none' };
  };

  const acceptedMembers = useMemo(() => {
    const ids = new Set(connections.filter(c => c.status === 'ACCEPTED').flatMap(c => [c.requesterId, c.recipientId]));
    return directory.filter(m => ids.has(m.id)).filter(m => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || (m.profile.title ?? '').toLowerCase().includes(q);
    });
  }, [connections, directory, search]);

  const incoming = useMemo(() => {
    const conns = connections.filter(c => c.status === 'PENDING' && c.recipientId === user?.id);
    return conns.map(c => ({ conn: c, member: directory.find(d => d.id === c.requesterId) })).filter(x => x.member);
  }, [connections, directory, user?.id]);

  const exploreMembers = useMemo(() => {
    const activeConn = new Map<string, Connection>();
    for (const c of connections) {
      activeConn.set(c.requesterId, c);
      activeConn.set(c.recipientId, c);
    }
    const statusOf = (memberId: string): string => {
      const conn = activeConn.get(memberId);
      if (!conn) return 'none';
      if (conn.status === 'ACCEPTED') return 'accepted';
      if (conn.status === 'PENDING') return conn.requesterId === user?.id ? 'pending-out' : 'pending-in';
      return 'none';
    };
    let list = directory.filter(m => statusOf(m.id) !== 'accepted');
    if (sectorFilter !== 'all') list = list.filter(m => m.profile.sectors.includes(sectorFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || (m.profile.title ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [directory, connections, search, sectorFilter, user?.id]);

  const sectors = useMemo(() => [...new Set(directory.flatMap(m => m.profile.sectors))].sort(), [directory]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">My Network</h1>
        <p className="text-sm text-muted-foreground">
          {acceptedMembers.length} connections · {incoming.length} pending {t('community') === 'Network' ? 'requests' : 'requests'} across your {t('community').toLowerCase()}
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-80">
            <TabsTrigger value="connections">My Networks</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="invitations" className="relative">
              Invitations
              {incoming.length > 0 && <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[9px]">{incoming.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" className="pl-9" />
          </div>
          {tab === 'explore' && sectors.length > 0 && (
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sectors</SelectItem>
                {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {tab === 'connections' && (
            <div className="space-y-3">
              {acceptedMembers.length === 0 ? (
                <EmptyState icon={Users} title="No connections yet" description="Head to Explore to connect with fellow members." action={<Button size="sm" onClick={() => setTab('explore')}>Explore members</Button>} />
              ) : acceptedMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  actions={
                    <>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('messaging', { id: member.id })}>
                        <MessageSquare className="h-3.5 w-3.5" /> Message
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Remove connection" aria-label="Remove connection"
                        onClick={() => respondMutation.mutate({ connId: statusFor(member.id).conn!.id, action: 'remove' })}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}

          {tab === 'explore' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Explore Network ({exploreMembers.length})</p>
              {exploreMembers.length === 0 ? (
                <EmptyState icon={Search} title="No members match your filters" description="Try clearing the search or sector filter." />
              ) : exploreMembers.map(member => {
                const st = statusFor(member.id).status;
                return (
                  <MemberRow
                    key={member.id}
                    member={member}
                    actions={
                      st === 'pending-out' ? (
                        <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3" /> Pending</Badge>
                      ) : st === 'pending-in' ? (
                        <Badge variant="secondary">Respond in Invitations</Badge>
                      ) : (
                        <Button size="sm" className="gap-1.5" disabled={connectMutation.isPending} onClick={() => connectMutation.mutate(member.id)}>
                          <UserPlus className="h-3.5 w-3.5" /> Connect
                        </Button>
                      )
                    }
                  />
                );
              })}
            </div>
          )}

          {tab === 'invitations' && (
            <div className="space-y-3">
              {incoming.length === 0 ? (
                <EmptyState icon={Mail} title="No pending invitations" description="Connection requests from other members will appear here." />
              ) : incoming.map(({ conn, member }) => (
                <MemberRow
                  key={conn.id}
                  member={member!}
                  actions={
                    <>
                      <Button size="sm" variant="ghost" onClick={() => respondMutation.mutate({ connId: conn.id, action: 'ignore' })} aria-label="Ignore request">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 hover:text-emerald-700" onClick={() => respondMutation.mutate({ connId: conn.id, action: 'accept' })}>
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {incoming.length > 0 && tab !== 'invitations' && (
        <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {incoming.length} connection request{incoming.length > 1 ? 's' : ''} awaiting your response
            </p>
            <Button size="sm" variant="outline" onClick={() => setTab('invitations')}>Review →</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
