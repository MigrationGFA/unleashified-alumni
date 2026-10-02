'use client';

// ============================================================
// Member dashboard home
// ============================================================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Calendar, Loader2, Newspaper, Sparkles, TrendingUp, UserPlus, Users, UsersRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { connectionsApi, eventsApi, groupsApi, postsApi } from '@/lib/db/client';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { PostCard } from '@/components/member/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatEventDate } from '@/lib/format';

export function DashboardHome() {
  const { user, org, t } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const queryClient = useQueryClient();

  const { data: connections = [] } = useQuery({
    queryKey: ['connections', user?.id],
    queryFn: () => connectionsApi.network(org!.id, user!.id),
    enabled: !!user?.id && !!org,
  });
  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', user?.id],
    queryFn: () => connectionsApi.suggestions(org!.id, user!.id),
    enabled: !!user?.id && !!org,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ['feed', org?.id],
    queryFn: () => postsApi.listFeed(org!.id),
    enabled: !!org,
  });
  const { data: events = [] } = useQuery({
    queryKey: ['events', org?.id],
    queryFn: () => eventsApi.list(org!.id),
    enabled: !!org,
  });
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', org?.id],
    queryFn: () => groupsApi.list(org!.id),
    enabled: !!org,
  });

  const accepted = connections.filter(c => c.status === 'ACCEPTED');
  const pendingIncoming = connections.filter(c => c.status === 'PENDING' && c.recipientId === user?.id);
  const upcoming = events.filter(e => new Date(e.startTime) > new Date() && (e.status === 'ACTIVE')).slice(0, 3);
  const myGroups = groups.filter(g => g.members.some(m => m.userId === user?.id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Connections', value: accepted.length, icon: Users, view: 'network' },
    { label: `My ${t('cohort')} Posts`, value: posts.filter(p => p.authorId === user?.id).length, icon: Newspaper, view: 'settings' },
    { label: `My ${t('node') === 'Node' ? 'Groups' : 'Groups'}`, value: myGroups.length, icon: UsersRound, view: 'groups' },
    { label: 'Upcoming Events', value: upcoming.length, icon: Calendar, view: 'events' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6" style={undefined}>
      {/* Hero */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: `linear-gradient(120deg, ${org?.colors.primary ?? '#1B2F5B'} 0%, ${org?.colors.secondary ?? '#233389'} 100%)` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/8 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/6 blur-xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">{greeting}, {user?.firstName}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {org ? `Welcome to ${org.shortName}` : 'Welcome to your workspace'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
            {posts.length} community posts · {upcoming.length} upcoming events · {pendingIncoming.length > 0 ? `${pendingIncoming.length} connection request${pendingIncoming.length > 1 ? 's' : ''} waiting` : 'no pending requests'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => navigate('newsfeed')}>
              <Newspaper className="h-3.5 w-3.5" /> Open newsfeed
            </Button>
            <Button size="sm" className="gap-1.5 bg-white/15 text-white hover:bg-white/25" onClick={() => navigate('marketplace')}>
              <Briefcase className="h-3.5 w-3.5" /> Browse marketplace
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(stat => (
          <button key={stat.label} onClick={() => navigate(stat.view)} className="rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-org-primary" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="h-4 w-4 text-org-accent" /> Recent community activity</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('newsfeed')}>View all →</Button>
            </div>
            {posts.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-10 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">The feed is quiet</p>
                <p className="mt-1 text-xs text-muted-foreground">Share the first update with your community.</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('newsfeed')}>Create a post</Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {posts.slice(0, 2).map(post => (
                  <PostCard key={post.id} post={post} onNavigateToProfile={userId => navigate('profile', { id: userId })} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold"><Calendar className="h-4 w-4 text-org-primary" /> Upcoming events</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('events')}>View all →</Button>
            </div>
            <div className="space-y-2.5">
              {upcoming.map(event => (
                <button key={event.id} onClick={() => navigate('event', { id: event.id })} className="flex w-full items-center gap-4 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
                    <span className="text-[9px] font-semibold uppercase leading-none opacity-80">{new Date(event.startTime).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-tight">{new Date(event.startTime).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{event.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatEventDate(event.startTime)} · {event.type === 'online' ? 'Online' : event.venue ?? event.address ?? 'In person'} · {event.attendeeIds.length} registered
                    </p>
                  </div>
                  {event.attendeeIds.includes(user?.id ?? '') && <Badge variant="secondary" className="shrink-0">Registered</Badge>}
                </button>
              ))}
              {upcoming.length === 0 && (
                <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">No upcoming events scheduled.</CardContent></Card>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-org-accent" /> Suggested connections</h3>
              </div>
              <div className="space-y-3">
                {suggestions.slice(0, 4).map(s => (
                  <SuggestionRow key={s.id} suggestion={s} onConnected={() => queryClient.invalidateQueries({ queryKey: ['suggestions'] })} />
                ))}
                {suggestions.length === 0 && (
                  <p className="py-3 text-center text-xs text-muted-foreground">You are connected with everyone active — impressive network!</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('network')}>Explore network →</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><UsersRound className="h-4 w-4 text-org-primary" /> Your {t('community') === 'Network' ? 'groups' : 'groups'}</h3>
              <div className="space-y-2">
                {myGroups.slice(0, 4).map(g => (
                  <button key={g.id} onClick={() => navigate('group', { id: g.id })} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: 'var(--org-secondary)' }}>
                      {g.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{g.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{g.members.length} members · {g.privacyMode === 'CLOSED' ? 'Private' : 'Public'}</span>
                    </span>
                  </button>
                ))}
                {myGroups.length === 0 && <p className="py-3 text-center text-xs text-muted-foreground">You have not joined any groups yet.</p>}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('groups')}>Discover groups →</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ============================================================
// Suggested connection row
// ============================================================
function SuggestionRow({ suggestion, onConnected }: { suggestion: { id: string; firstName: string; lastName: string; profile?: { avatarUrl?: string | null; title?: string; companyName?: string; sectors?: string[] } }; onConnected: () => void }) {
  const { user, org } = useApp();
  const mutation = useMutation({
    mutationFn: () => connectionsApi.connect(org!.id, user!.id, suggestion.id),
    onSuccess: () => { toast.success(`Connection request sent to ${suggestion.firstName}.`); onConnected(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex items-center gap-3">
      <UserAvatar user={suggestion} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{suggestion.firstName} {suggestion.lastName}</p>
        <p className="truncate text-[10px] text-muted-foreground">{suggestion.profile?.title ?? suggestion.profile?.sectors?.[0] ?? 'Member'}</p>
      </div>
      <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
      </Button>
    </div>
  );
}
