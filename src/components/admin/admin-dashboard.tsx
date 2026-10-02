'use client';

// ============================================================
// Admin dashboard — KPIs, charts, reported-posts moderation
// (ported from stp-admin dashboard + content hub)
// ============================================================
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, Briefcase, CalendarDays, EyeOff, Loader2,
  Megaphone, ShieldCheck, TrendingUp, Trash2, Users, Zap,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { analyticsApi, postsApi, securityApi, usersApi } from '@/lib/db/client';
import type { Post } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { StatCard } from '@/components/shared/primitives';
import { timeAgo } from '@/lib/format';

const SECTOR_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

function ReportedPostCard({ post, onModerated }: { post: Post; onModerated?: () => void }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: author } = useQuery({ queryKey: ['user', post.authorId], queryFn: () => usersApi.get(post.authorId) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reported-posts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    onModerated?.();
  };

  const hideMutation = useMutation({
    mutationFn: () => postsApi.setVisibility(post.id, post.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN'),
    onSuccess: () => {
      invalidate();
      toast.success(post.status === 'HIDDEN' ? 'Post restored to the feed.' : 'Post hidden from the community feed.');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => postsApi.delete(post.id),
    onSuccess: () => { invalidate(); toast.success('Post permanently deleted.'); },
  });

  const isHidden = post.status === 'HIDDEN';

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar user={author} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{author ? `${author.firstName} ${author.lastName}` : 'Member'}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {isHidden ? (
          <Badge variant="secondary" className="gap-1 shrink-0"><EyeOff className="h-3 w-3" /> Hidden</Badge>
        ) : (
          <Badge variant="destructive" className="gap-1 shrink-0"><AlertTriangle className="h-3 w-3" /> Reported</Badge>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm">{post.body}</p>

      {post.reports.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <p className="font-semibold">Report reason: {post.reports[0].reason}</p>
          {post.reports[0].description && <p className="mt-0.5 text-[11px] opacity-80">{post.reports[0].description}</p>}
          <p className="mt-1 text-[10px] opacity-70">Flagged by {post.reports.length} member{post.reports.length > 1 ? 's' : ''} · {timeAgo(post.reports[0].createdAt)}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setDetailOpen(true)}>View full post</Button>
        <Button size="sm" variant={isHidden ? 'default' : 'secondary'} disabled={hideMutation.isPending} onClick={() => hideMutation.mutate()}>
          {hideMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isHidden ? 'Unhide post' : 'Hide post'}
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} aria-label="Delete post">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {author ? `${author.firstName} ${author.lastName}` : 'Member'} — reported post
              <Badge variant={isHidden ? 'secondary' : 'destructive'}>{isHidden ? 'Hidden' : 'Reported'}</Badge>
            </DialogTitle>
            <DialogDescription>{author?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {post.reports.map(r => (
              <div key={r.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/40">
                <p className="font-semibold text-amber-800 dark:text-amber-300">{r.reason}</p>
                {r.description && <p className="mt-1 text-amber-700/90 dark:text-amber-300/80">{r.description}</p>}
              </div>
            ))}
            <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">{post.body}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
            <Button variant="outline" onClick={() => { hideMutation.mutate(); setDetailOpen(false); }}>{isHidden ? 'Unhide' : 'Hide'}</Button>
            <Button variant="destructive" onClick={() => { setDetailOpen(false); setDeleteOpen(true); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this post?</AlertDialogTitle>
            <AlertDialogDescription>The post, its comments and reports will be removed. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>Delete post</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AdminDashboard() {
  const { org } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const [tab, setTab] = useState<'general' | 'analytics'>('general');

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', org?.id],
    queryFn: () => analyticsApi.dashboardSummary(org!.id),
    enabled: !!org,
  });
  const { data: analytics } = useQuery({
    queryKey: ['org-analytics', org?.id],
    queryFn: () => analyticsApi.orgAnalytics(org!.id),
    enabled: !!org,
  });
  const { data: reported = [] } = useQuery({
    queryKey: ['reported-posts', org?.id],
    queryFn: () => postsApi.listReported(org!.id),
    enabled: !!org,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['security-logs', org?.id],
    queryFn: () => securityApi.logs({ orgId: org!.id, limit: 6 }),
    enabled: !!org,
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reported-posts'] });

  if (!summary) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Monitor {org?.shortName ?? 'your organization'} — members, engagement and moderation.</p>
        </div>
        <div className="flex gap-1.5 rounded-lg border bg-card p-1">
          {(['general', 'analytics'] as const).map(t => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${tab === t ? 'bg-org-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              style={tab === t ? { backgroundColor: 'var(--org-primary)' } : undefined}
            >
              {t === 'general' ? 'General Overview' : 'Analytics'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'general' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title={`Total ${org?.terminology.member ?? 'Members'}`} value={summary.totalUsers} icon={Users} iconClassName="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" description={`${summary.activeUsers} active`} />
            <StatCard title="Verified" value={summary.verifiedUsers} icon={ShieldCheck} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" description={`${summary.pendingUsers} pending review`} highlight={summary.pendingUsers > 0} />
            <StatCard title="Active Groups" value={summary.totalGroups} icon={Users} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" description={`${summary.pendingGroups} pending approval`} highlight={summary.pendingGroups > 0} />
            <StatCard title="Active Events" value={summary.totalEvents} icon={CalendarDays} iconClassName="text-rose-600 bg-rose-50 dark:bg-rose-950/50" description={`${summary.pendingEvents} pending approval`} highlight={summary.pendingEvents > 0} />
          </div>

          {/* Reported posts */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Reported community posts</CardTitle>
                <CardDescription>{reported.length} post{reported.length !== 1 ? 's' : ''} flagged by members for review</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('admin-content')}>Manage in Content Hub →</Button>
            </CardHeader>
            <CardContent>
              {reported.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nothing flagged — the community is healthy. 🎉</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {reported.slice(0, 4).map(post => <ReportedPostCard key={post.id} post={post} onModerated={invalidate} />)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-base">Member growth & engagement</CardTitle>
                <CardDescription>Monthly members vs posts (mock trend)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.byMonth ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="members" name="Members" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="posts" name="Posts" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Verification status</CardTitle>
                <CardDescription>Verified vs pending members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Verified', value: summary.verifiedUsers },
                          { name: 'Pending verification', value: summary.pendingUsers },
                        ]}
                        cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#0f172a" />
                        <Cell fill="#f97316" />
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity + security */}
          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Recent security activity</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate('admin-content')}>View all →</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {logs.slice(0, 6).map(log => {
                    const icon = log.eventType === 'LOGIN_SUCCESS' ? ShieldCheck
                      : log.eventType === 'LOGIN_FAILED' ? AlertTriangle
                      : log.eventType.includes('PASSWORD') ? Activity : ShieldCheck;
                    const color = log.eventType === 'LOGIN_SUCCESS' ? 'text-emerald-600' : log.eventType === 'LOGIN_FAILED' ? 'text-destructive' : 'text-amber-600';
                    return (
                      <div key={log.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                        {(() => { const Ic = icon; return <Ic className={`h-4 w-4 shrink-0 ${color}`} />; })()}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{log.eventType.replace(/_/g, ' ')}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{log.email} · {log.ipAddress}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(log.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">System health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Mock data layer — Operational</p>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total members</span><span className="font-semibold">{summary.totalUsers}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Connections formed</span><span className="font-semibold">{summary.connections}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Open support tickets</span><span className="font-semibold">{summary.supportOpen}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deal rooms</span><span className="font-semibold">{summary.dealRooms} ({summary.pendingDealRooms} pending)</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => navigate('org-settings')}>
                  <Megaphone className="h-3.5 w-3.5" /> Organization settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Total active members" value={analytics.totalMembers} icon={Users} iconClassName="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" description={`${analytics.totalCountries} countries`} />
            <StatCard title="Onboarded members" value={analytics.onboardedMembers} icon={Zap} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" description={`${Math.round((analytics.onboardedMembers / Math.max(1, analytics.totalMembers)) * 100)}% onboarding rate`} />
            <StatCard title="Groups & deal rooms" value={`${analytics.totalGroups} / ${analytics.totalDealRooms}`} icon={Briefcase} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" description="Active communities & rooms" />
            <StatCard title="Engagement volume" value={`${analytics.totalPosts} / ${analytics.totalEvents}`} icon={TrendingUp} iconClassName="text-rose-600 bg-rose-50 dark:bg-rose-950/50" description="Posts / events" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Members by country</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.byCountry} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" name="Members" radius={[0, 4, 4, 0]}>
                        {analytics.byCountry.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Members by sector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.bySector.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="sector" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" name="Members" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement leaderboard</CardTitle>
              <CardDescription>Members ranked by posts, comments, likes and connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.leaderboard.map((leader, i) => (
                  <div key={leader.userId} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : i === 1 ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                      : 'bg-muted text-muted-foreground'
                    }`}>{i + 1}</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{leader.name}</p>
                    <Badge variant="secondary" className="shrink-0">{leader.activityScore} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
