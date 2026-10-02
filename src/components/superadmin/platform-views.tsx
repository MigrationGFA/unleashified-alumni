'use client';

// ============================================================
// Super Admin — platform dashboard + organizations + create wizard
// (NEW multi-tenant capability)
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight, BarChart3, Building2, CheckCircle2, Globe2, Loader2, Plus,
  ShieldCheck, Sparkles, TrendingUp, Users, UsersRound,
} from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { analyticsApi, orgsApi, usersApi } from '@/lib/db/client';
import type { OrgType, Organization } from '@/lib/db/types';
import { useAppStore } from '@/stores/useAppStore';
import { OrgLogo } from '@/components/shared/org-logo';
import { StatCard, EmptyState } from '@/components/shared/primitives';
import { formatDate } from '@/lib/format';

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  UNIVERSITY: 'University', CORPORATE: 'Corporate', ASSOCIATION: 'Association',
  ACCELERATOR: 'Accelerator', COMMUNITY: 'Community',
};

// ---------------- Platform dashboard ----------------
export function PlatformDashboard() {
  const navigate = useAppStore(s => s.navigate);
  const { data: summary } = useQuery({ queryKey: ['platform-summary'], queryFn: () => analyticsApi.platformSummary() });
  const { data: overviews = [] } = useQuery({ queryKey: ['org-overviews'], queryFn: () => analyticsApi.orgOverviews() });

  if (!summary) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 rounded-2xl p-6 text-white sm:p-8" style={{ background: 'linear-gradient(120deg, #14224A 0%, #1B2F5B 45%, #233389 100%)' }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/8 blur-2xl" />
        <p className="text-sm font-medium text-white/70">Unleashified Platform Console</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">One platform, {summary.totalOrganizations} alumni communities</h1>
        <p className="mt-2 max-w-xl text-sm text-white/75">
          {summary.totalMembers} members · {summary.totalAdmins} organization admins · {summary.totalConnections} cross-community connections formed inside tenant boundaries.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5 bg-white text-[#1B2F5B] hover:bg-white/90" onClick={() => navigate('platform-orgs')}>
            <Building2 className="h-3.5 w-3.5" /> Manage organizations
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate('platform-analytics')}>
            <BarChart3 className="h-3.5 w-3.5" /> Platform analytics
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Organizations" value={summary.totalOrganizations} icon={Building2} iconClassName="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" description={`${summary.activeOrgs} active`} />
        <StatCard title="Total members" value={summary.totalMembers} icon={Users} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" description="Across all tenants" />
        <StatCard title="Community content" value={`${summary.totalPosts} / ${summary.totalEvents}`} icon={TrendingUp} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" description="Posts / events" />
        <StatCard title="Connections formed" value={summary.totalConnections} icon={UsersRound} iconClassName="text-rose-600 bg-rose-50 dark:bg-rose-950/50" description="Org-scoped networking" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Organizations overview</CardTitle>
              <CardDescription>Live snapshot of every tenant on the platform</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('platform-orgs')}>View all →</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Admins</TableHead>
                  <TableHead className="hidden text-center md:table-cell">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overviews.map(({ org, members, admins, posts, events }) => (
                  <TableRow key={org.id} className="cursor-pointer" onClick={() => navigate('org', { id: org.id })}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <OrgLogo org={org} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{org.shortName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{org.country}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{ORG_TYPE_LABELS[org.type]}</Badge></TableCell>
                    <TableCell className="text-center text-sm font-semibold tabular-nums">{members}</TableCell>
                    <TableCell className="hidden text-center text-sm tabular-nums sm:table-cell">{admins}</TableCell>
                    <TableCell className="hidden text-center text-xs text-muted-foreground md:table-cell">{posts} posts · {events} events</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member distribution</CardTitle>
            <CardDescription>Members per organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overviews.map(o => ({ name: o.org.shortName, value: o.members }))}
                    cx="50%" cy="45%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value"
                  >
                    {overviews.map((_, i) => <Cell key={i} fill={overviews[i].org.colors.primary} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------- Create org wizard ----------------
const COLOR_PRESETS = [
  { label: 'Navy & red', colors: { primary: '#1B2F5B', secondary: '#233389', accent: '#ED202D', highlight: '#FBAD17', sidebar: '#14224A' } },
  { label: 'Forest & gold', colors: { primary: '#14532D', secondary: '#166534', accent: '#B45309', highlight: '#F59E0B', sidebar: '#0B3D20' } },
  { label: 'Violet hub', colors: { primary: '#4C1D95', secondary: '#5B21B6', accent: '#BE185D', highlight: '#A78BFA', sidebar: '#3B1673' } },
  { label: 'Ocean teal', colors: { primary: '#0C4A6E', secondary: '#075985', accent: '#0F766E', highlight: '#38BDF8', sidebar: '#082F49' } },
  { label: 'Sunset', colors: { primary: '#7C2D12', secondary: '#9A3412', accent: '#C2410C', highlight: '#FB923C', sidebar: '#431407' } },
];

function CreateOrgWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const navigate = useAppStore(s => s.navigate);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', shortName: '', type: 'UNIVERSITY' as OrgType, country: '',
    description: '', mission: '', website: '', contactEmail: '',
    colors: COLOR_PRESETS[0].colors,
    terminology: { cohort: 'Cohort', node: 'Node', member: 'Alumni', community: 'Network' } as Organization['terminology'],
    adminFirst: '', adminLast: '', adminEmail: '',
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(f => ({ ...f, [key]: value }));

  const step1Valid = form.name.trim().length > 3 && form.shortName.trim() && form.country.trim() && form.description.trim().length > 10;
  const step2Valid = form.adminFirst.trim() && form.adminLast.trim() && form.adminEmail.includes('@');

  const mutation = useMutation({
    mutationFn: () => orgsApi.create(form),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['org-overviews'] });
      queryClient.invalidateQueries({ queryKey: ['platform-summary'] });
      queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      onOpenChange(false);
      setStep(0);
      setForm(f => ({ ...f, name: '', shortName: '', description: '', mission: '', website: '', contactEmail: '', adminFirst: '', adminLast: '', adminEmail: '' }));
      toast.success(`${org.shortName} provisioned — admin account created with temporary password.`);
      navigate('org', { id: org.id });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = [
    { title: 'Organization identity', desc: 'Who is joining the platform?' },
    { title: 'Branding & terminology', desc: 'Colors and vocabulary for their workspace' },
    { title: 'Initial administrator', desc: 'The first org admin account' },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setStep(0); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /> Onboard a new organization</DialogTitle>
          <DialogDescription>Provision a fully-branded tenant workspace in three steps.</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${i < step ? 'border-violet-600 bg-violet-600 text-white' : i === step ? 'border-violet-600 text-violet-600' : 'border-border text-muted-foreground'}`}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 rounded ${i < step ? 'bg-violet-600' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
        <p className="-mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{steps[step].title}</span> — {steps[step].desc}</p>

        {step === 0 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ashesi University Alumni" maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label>Short name *</Label>
                <Input value={form.shortName} onChange={e => set('shortName', e.target.value)} placeholder="e.g. Ashesi Alumni" maxLength={24} />
              </div>
              <div className="space-y-2">
                <Label>Organization type</Label>
                <Select value={form.type} onValueChange={v => set('type', v as OrgType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ORG_TYPE_LABELS) as OrgType[]).map(t => <SelectItem key={t} value={t}>{ORG_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Ghana" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="What is this alumni community about?" />
            </div>
            <div className="space-y-2">
              <Label>Mission</Label>
              <Input value={form.mission} onChange={e => set('mission', e.target.value)} placeholder="One-line mission statement" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label>Contact email</Label>
                <Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="alumni@institution.org" />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brand palette</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.label} type="button"
                    onClick={() => set('colors', p.colors)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${JSON.stringify(form.colors) === JSON.stringify(p.colors) ? 'border-violet-600 ring-1 ring-violet-600' : 'hover:bg-muted/50'}`}
                  >
                    <span className="flex -space-x-1">
                      <span className="h-4 w-4 rounded-full border border-background" style={{ backgroundColor: p.colors.primary }} />
                      <span className="h-4 w-4 rounded-full border border-background" style={{ backgroundColor: p.colors.accent }} />
                      <span className="h-4 w-4 rounded-full border border-background" style={{ backgroundColor: p.colors.highlight }} />
                    </span>
                    <span className="text-xs font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Terminology</Label>
              <p className="text-[11px] text-muted-foreground">How this community names core concepts. Quick presets:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'University', t: { cohort: 'Class Year', node: 'Chapter', member: 'Alumni', community: 'Association' } },
                  { label: 'Accelerator', t: { cohort: 'Batch', node: 'City Chapter', member: 'Founder', community: 'Hub' } },
                  { label: 'Corporate', t: { cohort: 'Program Year', node: 'Office', member: 'Colleague', community: 'Network' } },
                ].map(p => (
                  <button
                    key={p.label} type="button"
                    onClick={() => set('terminology', p.t as Organization['terminology'])}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${JSON.stringify(form.terminology) === JSON.stringify(p.t) ? 'border-violet-600 bg-violet-600 text-white' : 'border-border hover:bg-muted/50'}`}
                  >
                    {p.label} style
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {(Object.keys(form.terminology) as (keyof Organization['terminology'])[]).map(k => (
                  <div key={k} className="space-y-1.5">
                    <Label className="capitalize">{k}</Label>
                    <Input value={form.terminology[k]} onChange={e => set('terminology', { ...form.terminology, [k]: e.target.value })} maxLength={20} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Preview: “Join <b className="text-foreground">{form.terminology.member.toLowerCase()}s</b> from every <b className="text-foreground">{form.terminology.cohort.toLowerCase()}</b> and <b className="text-foreground">{form.terminology.node.toLowerCase()}</b> of <b className="text-foreground">{form.shortName || 'the community'}</b>.”
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
              The administrator receives a temporary password and must change it at first login. They manage their organization&apos;s members, content and branding.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Admin first name *</Label>
                <Input value={form.adminFirst} onChange={e => set('adminFirst', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Admin last name *</Label>
                <Input value={form.adminLast} onChange={e => set('adminLast', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Admin work email *</Label>
              <Input type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="admin@institution.org" />
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Provisioning summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="col-span-2 truncate"><span className="text-muted-foreground">Organization:</span> <b>{form.name || '—'}</b></p>
                <p><span className="text-muted-foreground">Type:</span> {ORG_TYPE_LABELS[form.type]}</p>
                <p><span className="text-muted-foreground">Country:</span> {form.country || '—'}</p>
                <p className="col-span-2 truncate"><span className="text-muted-foreground">Administrator:</span> <b>{form.adminFirst ? `${form.adminFirst} ${form.adminLast}` : '—'}</b></p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</Button>
          {step < 2 ? (
            <Button disabled={step === 0 && !step1Valid} onClick={() => setStep(s => s + 1)} className="gap-1.5">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={!step1Valid || !step2Valid || mutation.isPending} onClick={() => mutation.mutate()} className="gap-1.5">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Building2 className="h-4 w-4" /> Provision organization</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Organizations list ----------------
export function PlatformOrgsView() {
  const navigate = useAppStore(s => s.navigate);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: overviews = [], isLoading } = useQuery({
    queryKey: ['org-overviews'],
    queryFn: () => analyticsApi.orgOverviews(),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return overviews;
    const q = search.toLowerCase();
    return overviews.filter(o => o.org.name.toLowerCase().includes(q) || o.org.shortName.toLowerCase().includes(q) || o.org.country.toLowerCase().includes(q));
  }, [overviews, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">Every alumni community tenant on the platform — onboard any institution, association or network.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations…" className="w-full sm:w-56" />
          </div>
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New organization</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No organizations found" description="Provision the first tenant with the New Organization wizard." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ org, members, admins, posts, events, joinedThisMonth }) => (
            <Card key={org.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate('org', { id: org.id })}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <OrgLogo org={org} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{org.shortName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{ORG_TYPE_LABELS[org.type]} · {org.country}</p>
                    <Badge variant="secondary" className="mt-1.5 gap-1"><CheckCircle2 className="h-3 w-3" /> {org.status === 'ACTIVE' ? 'Active' : org.status}</Badge>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{org.description}</p>
                <div className="mt-4 grid grid-cols-4 gap-1 border-t pt-3 text-center">
                  <div><p className="text-sm font-bold tabular-nums">{members}</p><p className="text-[9px] text-muted-foreground">Members</p></div>
                  <div><p className="text-sm font-bold tabular-nums">{admins}</p><p className="text-[9px] text-muted-foreground">Admins</p></div>
                  <div><p className="text-sm font-bold tabular-nums">{posts}</p><p className="text-[9px] text-muted-foreground">Posts</p></div>
                  <div><p className="text-sm font-bold tabular-nums">{events}</p><p className="text-[9px] text-muted-foreground">Events</p></div>
                </div>
                {joinedThisMonth > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600">
                    <TrendingUp className="h-3 w-3" /> {joinedThisMonth} new members in the last 30 days
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateOrgWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ---------------- Organization detail (superadmin) ----------------
export function OrgDetailView({ orgId }: { orgId: string }) {
  const navigate = useAppStore(s => s.navigate);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: org } = useQuery({
    queryKey: ['platform-org', orgId],
    queryFn: () => orgsApi.get(orgId),
    enabled: !!orgId,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['org-users', orgId],
    queryFn: () => usersApi.listByOrg(orgId),
    enabled: !!orgId,
  });

  if (!org) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const admins = users.filter(u => u.role === 'ADMIN');
  const members = users.filter(u => u.role === 'MEMBER');

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <button onClick={() => navigate('platform-orgs')} className="mb-4 text-sm font-medium text-muted-foreground hover:text-foreground">
        ← All organizations
      </button>

      <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="p-6" style={{ background: `linear-gradient(120deg, ${org.colors.primary}, ${org.colors.secondary})` }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur">
              <OrgLogo org={org} size="xl" />
            </div>
            <div className="min-w-0 flex-1 text-white">
              <h1 className="truncate text-xl font-bold sm:text-2xl">{org.name}</h1>
              <p className="mt-0.5 text-sm text-white/70">
                {ORG_TYPE_LABELS[org.type]} · {org.country} · joined {formatDate(org.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="bg-white/90 text-gray-900">{members.length} members</Badge>
                <Badge variant="secondary" className="bg-white/90 text-gray-900">{admins.length} admins</Badge>
                <Badge variant="secondary" className="bg-white/90 text-gray-900">{org.terminology.cohort} · {org.terminology.node}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administrators</CardTitle>
            <CardDescription>Org admins manage members, content and branding for this tenant only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
                <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Admin</Badge>
              </div>
            ))}
            {admins.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No administrators yet.</p>}
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Provision another admin
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Community configuration</CardTitle>
            <CardDescription>Terminology, governance and branding snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(org.terminology) as (keyof Organization['terminology'])[]).map(k => (
                <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</p>
                  <p className="text-sm font-medium">{org.terminology[k]}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              {[
                { label: 'Strict verification', on: org.settings.strictVerification },
                { label: 'Opportunity moderation', on: org.settings.opportunityModeration },
                { label: 'Guest view', on: org.settings.allowGuestView },
              ].map(s => (
                <p key={s.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <Badge variant={s.on ? 'secondary' : 'outline'} className={s.on ? 'text-emerald-600' : 'text-muted-foreground'}>
                    {s.on ? 'ON' : 'OFF'}
                  </Badge>
                </p>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex -space-x-1">
                <span className="h-5 w-5 rounded-full border border-background" style={{ backgroundColor: org.colors.primary }} />
                <span className="h-5 w-5 rounded-full border border-background" style={{ backgroundColor: org.colors.secondary }} />
                <span className="h-5 w-5 rounded-full border border-background" style={{ backgroundColor: org.colors.accent }} />
                <span className="h-5 w-5 rounded-full border border-background" style={{ backgroundColor: org.colors.highlight }} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Globe2 className="h-3.5 w-3.5" /> {org.website}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateOrgWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
