'use client';

// ============================================================
// Super Admin — analytics + security logs + platform settings
// ============================================================
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, Database, Download, KeyRound, Loader2, Lock, RotateCcw,
  ShieldAlert, ShieldCheck, Trash2,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { analyticsApi, orgsApi, resetDatabase, securityApi } from '@/lib/db/client';
import type { SecurityEventType } from '@/lib/db/types';
import { StatCard, EmptyState } from '@/components/shared/primitives';
import { timeAgo } from '@/lib/format';

// ---------------- Platform analytics ----------------
export function PlatformAnalyticsView() {
  const { data: overviews = [], isLoading } = useQuery({
    queryKey: ['org-overviews'],
    queryFn: () => analyticsApi.orgOverviews(),
  });
  const { data: summary } = useQuery({ queryKey: ['platform-summary'], queryFn: () => analyticsApi.platformSummary() });

  const membershipTrend = useMemo(() => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const bases = overviews.map((o, i) => Math.max(2, o.members - (months.length - 1) + i));
    return months.map((month, mi) => {
      const row: Record<string, number | string> = { month };
      overviews.forEach((o, oi) => {
        row[o.org.shortName] = Math.max(1, bases[oi] + mi + Math.floor(Math.sin((mi + oi) / 2) * 2));
      });
      return row;
    });
  }, [overviews]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Cross-tenant growth, engagement and organization comparison.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Total members" value={summary?.totalMembers ?? 0} icon={Activity} iconClassName="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" description={`${summary?.totalOrganizations ?? 0} organizations`} />
        <StatCard title="Admins" value={summary?.totalAdmins ?? 0} icon={ShieldCheck} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" description="Organization-level" />
        <StatCard title="Content volume" value={`${summary?.totalPosts ?? 0} / ${summary?.totalEvents ?? 0}`} icon={Database} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" description="Posts / events" />
        <StatCard title="Connections" value={summary?.totalConnections ?? 0} icon={Activity} iconClassName="text-rose-600 bg-rose-50 dark:bg-rose-950/50" description="Within tenant boundaries" />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membership growth by organization</CardTitle>
            <CardDescription>Members onboarded per tenant over recent months (mock trend)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={membershipTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {overviews.map(o => (
                    <Line key={o.org.id} type="monotone" dataKey={o.org.shortName} stroke={o.org.colors.primary} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement by organization</CardTitle>
              <CardDescription>Posts created per tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviews.map(o => ({ name: o.org.shortName, posts: o.posts, events: o.events }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="posts" name="Posts" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="events" name="Events" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenant comparison</CardTitle>
              <CardDescription>Members, admins and connections</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead className="text-center">Admins</TableHead>
                    <TableHead className="text-center">Connections</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overviews.map(o => (
                    <TableRow key={o.org.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.org.colors.primary }} />
                          <span className="text-sm font-medium">{o.org.shortName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{o.members}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{o.admins}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{o.connections}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------- Security logs ----------------
const EVENT_ICONS: Record<SecurityEventType, { icon: typeof ShieldCheck; className: string }> = {
  LOGIN_SUCCESS: { icon: ShieldCheck, className: 'text-emerald-600' },
  LOGIN_FAILED: { icon: AlertTriangle, className: 'text-destructive' },
  PASSWORD_RESET_REQUEST: { icon: KeyRound, className: 'text-amber-600' },
  PASSWORD_RESET_COMPLETED: { icon: KeyRound, className: 'text-indigo-600' },
  ACCOUNT_LOCKED: { icon: Lock, className: 'text-rose-600' },
  ACCOUNT_DELETED: { icon: Trash2, className: 'text-rose-600' },
  ROLE_CHANGED: { icon: ShieldAlert, className: 'text-violet-600' },
};

export function PlatformSecurityView() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [limit, setLimit] = useState('25');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['security-logs', typeFilter, limit],
    queryFn: () => securityApi.logs({ limit: parseInt(limit) }),
  });
  const { data: bruteForce = [] } = useQuery({
    queryKey: ['brute-force'],
    queryFn: () => securityApi.bruteForce(),
  });

  const filtered = typeFilter === 'all' ? logs : logs.filter(l => l.eventType === typeFilter);

  const exportLogs = () => {
    const header = 'Event Type,Email,IP Address,Timestamp\n';
    const rows = filtered.map(l => `${l.eventType},${l.email},${l.ipAddress},${l.createdAt}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'security_audit_log.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} audit entries.`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security & Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Platform-wide authentication and account events across all tenants.</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={exportLogs}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      {bruteForce.length > 0 && (
        <Card className="mb-4 border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive"><ShieldAlert className="h-4 w-4" /> Brute force activity detected</CardTitle>
            <CardDescription>Repeated failed logins from the same IP address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bruteForce.map(bf => (
              <div key={bf.ipAddress} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="font-mono text-xs font-semibold">{bf.ipAddress}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{bf.attempts} failed attempts</Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard?.writeText(bf.ipAddress); toast.success('IP copied.'); }}>Copy IP</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {(Object.keys(EVENT_ICONS) as SecurityEventType[]).map(t => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['10', '25', '50', '100'].map(n => <SelectItem key={n} value={n}>{n} entries</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No security events" description="Authentication events across all organizations appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">IP address</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => {
                  const meta = EVENT_ICONS[log.eventType] ?? EVENT_ICONS.LOGIN_SUCCESS;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <meta.icon className={`h-4 w-4 ${meta.className}`} />
                          <span className="text-xs font-medium">{log.eventType.replace(/_/g, ' ')}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-xs text-muted-foreground">{log.email}</TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{log.ipAddress}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{timeAgo(log.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------- Platform settings ----------------
export function PlatformSettingsView() {
  const { data: orgs = [] } = useQuery({ queryKey: ['platform-orgs'], queryFn: () => orgsApi.list() });
  const [rules, setRules] = useState({
    publicRegistration: false,
    crossTenantMessaging: false,
    mandatoryNda: true,
    auditRetention: true,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Governance defaults applied to every organization tenant.</p>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform governance defaults</CardTitle>
            <CardDescription>Organizations can tighten — but not loosen — these rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'publicRegistration' as const, title: 'Public self-registration', desc: 'Allow visitors to request accounts without admin provisioning (default: closed ecosystem).' },
              { key: 'crossTenantMessaging' as const, title: 'Cross-tenant messaging', desc: 'Let members message across organizations (default: off — networks are isolated).' },
              { key: 'mandatoryNda' as const, title: 'Mandatory deal room NDA', desc: 'Require digital NDA signature before any deal room content is visible.' },
              { key: 'auditRetention' as const, title: 'Audit trail retention', desc: 'Keep immutable audit logs for deal rooms, admin actions and security events.' },
            ].map(rule => (
              <div key={rule.key} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">{rule.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rule.desc}</p>
                </div>
                <Switch checked={rules[rule.key]} onCheckedChange={v => setRules(r => ({ ...r, [rule.key]: v }))} aria-label={rule.title} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data exports</CardTitle>
            <CardDescription>Platform-wide CSV exports (mock)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'All members registry', desc: `${orgs.length} orgs` },
              { label: 'Networking activity', desc: 'Connections & messages' },
              { label: 'Deal room audit logs', desc: 'NDA & documents' },
            ].map(ex => (
              <div key={ex.label} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{ex.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{ex.desc}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={() => toast.info('Export simulated in mock mode.')}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-300 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400"><Database className="h-4 w-4" /> Mock data layer</CardTitle>
            <CardDescription>
              All data lives in a JSON text-DB persisted to your browser (localStorage) — no backend. Reset restores the original seed data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline" className="gap-1.5"
              onClick={() => {
                resetDatabase();
                toast.success('Mock database reset — reloading.');
                setTimeout(() => window.location.reload(), 800);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset demo database
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
