'use client';

// ============================================================
// ★ Organization Settings — community-level branding, details,
// custom terminology and governance (NEW multi-tenant feature)
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2, Check, Globe, Languages, Loader2, Palette, Save, Settings2, Sparkles, Type, Upload, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { orgsApi } from '@/lib/db/client';
import type { Organization } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { OrgLogo } from '@/components/shared/org-logo';
import { readFileAsDataUrl } from '@/lib/format';

// ---------------- Live branding preview ----------------
function BrandingPreview({ draft, logo }: { draft: Partial<Organization>; logo: string | null }) {
  const previewOrg = { shortName: draft.shortName ?? 'Community', logoStyle: { initials: (draft.shortName ?? 'OR').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), bg: draft.colors?.primary ?? '#1B2F5B', fg: '#FFFFFF' }, logoDataUrl: logo };
  const term = draft.terminology;
  return (
    <div className="space-y-3">
      {/* Sidebar mock */}
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <div className="flex items-center gap-2.5 px-3 py-3" style={{ backgroundColor: draft.colors?.sidebar ?? '#14224A' }}>
          <OrgLogo org={previewOrg} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{draft.shortName ?? 'Community'}</p>
            <p className="truncate text-[9px] text-white/50">Member Portal</p>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 bg-card p-2">
          {['Dashboard', 'Newsfeed', `My ${term?.cohort ?? 'Cohort'}`, `${term?.node ?? 'Node'}s`].map((label, i) => (
            <div key={label} className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[11px] ${i === 0 ? 'font-semibold' : 'text-muted-foreground'}`}
              style={i === 0 ? { backgroundColor: `${draft.colors?.primary ?? '#1B2F5B'}14`, color: draft.colors?.primary ?? '#1B2F5B' } : undefined}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i === 0 ? draft.colors?.accent ?? '#ED202D' : 'currentColor', opacity: i === 0 ? 1 : 0.35 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Card & button mock */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: draft.colors?.accent ?? '#ED202D' }}>Official</span>
          <span className="text-[10px] text-muted-foreground">Latest announcement</span>
        </div>
        <p className="mt-2 text-xs font-bold">Welcome to {draft.shortName ?? 'your community'}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Join {term?.member ?? 'alumni'} from every {term?.cohort ?? 'cohort'} and {term?.node ?? 'node'}.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md px-3 py-1.5 text-[10px] font-semibold text-white" style={{ backgroundColor: draft.colors?.primary ?? '#1B2F5B' }}>Primary button</span>
          <span className="rounded-md border px-3 py-1.5 text-[10px] font-semibold" style={{ color: draft.colors?.secondary ?? '#233389', borderColor: draft.colors?.secondary ?? '#233389' }}>Secondary</span>
          <span className="flex items-center rounded-md px-2 py-1.5 text-[10px] font-semibold" style={{ color: draft.colors?.highlight ?? '#FBAD17' }}>
            <Sparkles className="mr-1 h-3 w-3" /> Highlight
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Branding tab ----------------
const COLOR_FIELDS: { key: keyof Organization['colors']; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primary', hint: 'Buttons, links, active states' },
  { key: 'secondary', label: 'Secondary', hint: 'Gradients, outlines' },
  { key: 'accent', label: 'Accent', hint: 'Badges, alerts, highlights' },
  { key: 'highlight', label: 'Highlight', hint: 'Sidebar accents, focus marks' },
  { key: 'sidebar', label: 'Sidebar', hint: 'Dark sidebar background' },
];

function BrandingTab({ org, onSaved }: { org: Organization; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(org.name);
  const [shortName, setShortName] = useState(org.shortName);
  const [colors, setColors] = useState(org.colors);
  const [logo, setLogo] = useState<string | null>(org.logoDataUrl ?? null);

  const dirty = name !== org.name || shortName !== org.shortName || JSON.stringify(colors) !== JSON.stringify(org.colors) || logo !== (org.logoDataUrl ?? null);

  const mutation = useMutation({
    mutationFn: () => orgsApi.updateBranding(org.id, { name, shortName, colors, logoDataUrl: logo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org'] });
      onSaved();
      toast.success('Branding updated — applied live across the workspace.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4 text-org-primary" /> Logo & identity</CardTitle>
            <CardDescription>Uploaded logos are stored as data URLs in the mock DB and applied instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border p-1">
                <OrgLogo org={{ shortName, logoStyle: { initials: shortName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'OR', bg: colors.primary, fg: '#FFFFFF' }, logoDataUrl: logo }} size="xl" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 512 * 1024) { toast.error('Logo must be under 512KB.'); return; }
                    setLogo(await readFileAsDataUrl(file));
                  }} />
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-muted/50"><Upload className="h-3.5 w-3.5" /> Upload logo</span>
                </label>
                {logo && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setLogo(null)}>
                    <X className="h-3 w-3" /> Remove — use initials
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground">PNG/JPG/SVG · square recommended</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label>Short name</Label>
                <Input value={shortName} onChange={e => setShortName(e.target.value)} maxLength={24} />
                <p className="text-[11px] text-muted-foreground">Shown in the sidebar, header and previews.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brand colors</CardTitle>
            <CardDescription>Override the platform defaults — dark/light modes both adapt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {COLOR_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border" style={{ backgroundColor: colors[f.key] }}>
                  <input
                    type="color" value={colors[f.key]}
                    onChange={e => setColors(c => ({ ...c, [f.key]: e.target.value }))}
                    className="absolute inset-0 cursor-pointer opacity-0" aria-label={`${f.label} color`}
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                </div>
                <Input
                  value={colors[f.key]} onChange={e => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColors(c => ({ ...c, [f.key]: v }));
                    else setColors(c => ({ ...c, [f.key]: v as never }));
                  }}
                  className="h-8 w-24 font-mono text-xs"
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">Presets:</span>
              {[
                { label: 'STP classic', colors: { primary: '#1B2F5B', secondary: '#233389', accent: '#ED202D', highlight: '#FBAD17', sidebar: '#14224A' } },
                { label: 'Forest', colors: { primary: '#14532D', secondary: '#166534', accent: '#B45309', highlight: '#F59E0B', sidebar: '#0B3D20' } },
                { label: 'Violet hub', colors: { primary: '#4C1D95', secondary: '#5B21B6', accent: '#BE185D', highlight: '#A78BFA', sidebar: '#3B1673' } },
                { label: 'Ocean', colors: { primary: '#0C4A6E', secondary: '#075985', accent: '#0F766E', highlight: '#38BDF8', sidebar: '#082F49' } },
              ].map(p => (
                <button key={p.label} onClick={() => setColors(p.colors)} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] hover:bg-muted/50">
                  <span className="flex -space-x-1">
                    <span className="h-3 w-3 rounded-full border border-background" style={{ backgroundColor: p.colors.primary }} />
                    <span className="h-3 w-3 rounded-full border border-background" style={{ backgroundColor: p.colors.accent }} />
                    <span className="h-3 w-3 rounded-full border border-background" style={{ backgroundColor: p.colors.highlight }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} className="gap-1.5">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {dirty ? 'Save & apply branding' : 'Saved'}</>}
        </Button>
      </div>

      <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <p className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-org-accent" /> Live preview</p>
        <BrandingPreview draft={{ name, shortName, colors }} logo={logo} />
        <p className="px-1 text-[11px] text-muted-foreground">
          Preview reflects unsaved changes. On save, the sidebar, buttons, badges and charts re-theme instantly for every member of your organization.
        </p>
      </div>
    </div>
  );
}

// ---------------- Details tab ----------------
function DetailsTab({ org, onSaved }: { org: Organization; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    description: org.description, mission: org.mission, website: org.website,
    contactEmail: org.contactEmail, contactPhone: org.contactPhone, country: org.country,
    type: org.type,
    socialLinks: { ...org.socialLinks },
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(f => ({ ...f, [key]: value }));
  const dirty = JSON.stringify(form) !== JSON.stringify({ description: org.description, mission: org.mission, website: org.website, contactEmail: org.contactEmail, contactPhone: org.contactPhone, country: org.country, type: org.type, socialLinks: { ...org.socialLinks } });

  const mutation = useMutation({
    mutationFn: () => orgsApi.updateBranding(org.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org'] });
      onSaved();
      toast.success('Organization details updated.');
    },
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-org-primary" /> Organization details</CardTitle>
          <CardDescription>Shown on the login screen, member-facing pages and shared externally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Organization type</Label>
              <Select value={form.type} onValueChange={v => set('type', v as Organization['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['UNIVERSITY', 'CORPORATE', 'ASSOCIATION', 'ACCELERATOR', 'COMMUNITY'] as const).map(t => (
                    <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} maxLength={400} />
          </div>
          <div className="space-y-2">
            <Label>Mission statement</Label>
            <Textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={2} maxLength={200} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Official website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={form.website} onChange={e => set('website', e.target.value)} className="pl-9" placeholder="https://…" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact email</Label>
              <Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Founded year</Label>
              <Input value={org.foundedYear} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social links</CardTitle>
          <CardDescription>Displayed on community-facing surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(['linkedin', 'twitter', 'instagram', 'facebook'] as const).map(key => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key === 'twitter' ? 'X (Twitter)' : key}</Label>
              <Input
                value={form.socialLinks[key] ?? ''}
                onChange={e => set('socialLinks', { ...form.socialLinks, [key]: e.target.value || undefined })}
                placeholder={`https://${key === 'twitter' ? 'x' : key}.com/…`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} className="gap-1.5">
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save details</>}
      </Button>
    </div>
  );
}

// ---------------- Terminology tab ----------------
const TERMINOLOGY_FIELDS: { key: keyof Organization['terminology']; label: string; default: string; examples: string[] }[] = [
  { key: 'cohort', label: 'Cohort', default: 'Cohort', examples: ['Class Year', 'Batch', 'Intake', 'Graduating Class'] },
  { key: 'node', label: 'Node / Chapter', default: 'Node', examples: ['Chapter', 'City Chapter', 'Region', 'Branch'] },
  { key: 'member', label: 'Member', default: 'Alumni', examples: ['Member', 'Founder', 'Graduate', 'Alumnus'] },
  { key: 'community', label: 'Community', default: 'Network', examples: ['Association', 'Hub', 'Family', 'Union'] },
];

function TerminologyTab({ org, onSaved }: { org: Organization; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [terminology, setTerminology] = useState(org.terminology);
  const dirty = JSON.stringify(terminology) !== JSON.stringify(org.terminology);

  const mutation = useMutation({
    mutationFn: () => orgsApi.updateTerminology(org.id, terminology),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org'] });
      onSaved();
      toast.success('Terminology updated — labels change across the platform.');
    },
  });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Languages className="h-4 w-4 text-org-primary" /> Custom terminology</CardTitle>
            <CardDescription>
              Rename platform concepts to match how your community speaks. Labels update across the directory, profiles, onboarding wizard and feeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {TERMINOLOGY_FIELDS.map(f => (
              <div key={f.key} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label>{f.label}</Label>
                  <span className="text-[11px] text-muted-foreground">platform default: “{f.default}”</span>
                </div>
                <Input
                  value={terminology[f.key]}
                  onChange={e => setTerminology(t => ({ ...t, [f.key]: e.target.value }))}
                  maxLength={24}
                />
                <div className="flex flex-wrap gap-1.5">
                  {f.examples.map(ex => (
                    <button
                      key={ex} type="button"
                      onClick={() => setTerminology(t => ({ ...t, [f.key]: ex }))}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${terminology[f.key] === ex ? 'border-org-primary bg-org-primary text-white' : 'border-border text-muted-foreground hover:bg-muted/50'}`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} className="gap-1.5">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save terminology</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <p className="flex items-center gap-2 text-sm font-bold"><Type className="h-4 w-4 text-org-accent" /> How members will see it</p>
        <Card>
          <CardContent className="space-y-3 p-4 text-sm">
            <p><span className="text-muted-foreground">Directory:</span> “Search <b>{terminology.member.toLowerCase()}s</b> by {(terminology.cohort ?? 'cohort').toLowerCase()}, sector and location.”</p>
            <p><span className="text-muted-foreground">Profile:</span> “<b>{terminology.cohort}</b>: Cohort 7 · <b>{terminology.node}</b>: Lagos Node”</p>
            <p><span className="text-muted-foreground">Onboarding wizard:</span> “Tell the <b>{terminology.community.toLowerCase()}</b> who you are — your <b>{terminology.cohort.toLowerCase()}</b> and <b>{terminology.node.toLowerCase()}</b>.”</p>
            <p><span className="text-muted-foreground">Groups:</span> “The official <b>{terminology.node}</b> group for Lagos-based <b>{terminology.member.toLowerCase()}s</b>.”</p>
            <p><span className="text-muted-foreground">Sidebar label:</span> “<b>{terminology.community === 'Network' ? 'Newsfeed' : `${terminology.community} Newsfeed`}</b>”</p>
            <Badge variant="secondary" className="mt-1">Applied instantly after save</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------- Governance tab ----------------
function GovernanceTab({ org, onSaved }: { org: Organization; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(org.settings);

  const dirty = JSON.stringify(settings) !== JSON.stringify(org.settings);

  const mutation = useMutation({
    mutationFn: () => orgsApi.updateSettings(org.id, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org'] });
      onSaved();
      toast.success('Governance settings saved.');
    },
  });

  const toggles: { key: keyof Organization['settings']; title: string; description: string }[] = [
    { key: 'strictVerification', title: 'Strict verification', description: 'New members require manual admin verification before marketplace and deal room access.' },
    { key: 'opportunityModeration', title: 'Opportunity moderation', description: 'Member-created deal rooms and events require admin approval before going live.' },
    { key: 'allowGuestView', title: 'Guest view', description: 'Allow logged-out visitors to preview the public marketplace and events pages.' },
    { key: 'emailNotificationsDefault', title: 'Email notifications default ON', description: 'New accounts start with email notifications enabled (members can opt out).' },
  ];

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Settings2 className="h-4 w-4 text-org-primary" /> Community governance</CardTitle>
        <CardDescription>Platform rules applied to everyone in {org.shortName}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggles.map(tg => (
          <div key={tg.key} className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">{tg.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tg.description}</p>
            </div>
            <Switch
              checked={settings[tg.key]}
              onCheckedChange={v => setSettings(s => ({ ...s, [tg.key]: v }))}
              aria-label={tg.title}
            />
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Identity immutability is always enforced</span>
          <Badge variant="outline">Platform-level</Badge>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} className="gap-1.5">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save governance</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------- Main view ----------------
export function OrgSettingsView() {
  const { org, refetchOrg } = useApp();
  const [tab, setTab] = useState('branding');
  const queryClient = useQueryClient();

  // Derive a remount key directly from the org data (no state sync effects)
  const orgVersion = useMemo(() => JSON.stringify({
    id: org?.id,
    colors: org?.colors,
    logo: org?.logoDataUrl,
    term: org?.terminology,
    name: org?.name,
    settings: org?.settings,
  }), [org]);

  const onSaved = () => {
    refetchOrg();
    queryClient.invalidateQueries({ queryKey: ['org'] });
    queryClient.invalidateQueries({ queryKey: ['directory'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  if (!org) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EmptyNoOrg />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground">
          Community-level customization for <span className="font-semibold text-foreground">{org.name}</span> — branding, details, terminology and governance.
        </p>
      </div>

      <Tabs key={orgVersion} value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Branding</TabsTrigger>
          <TabsTrigger value="details" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Details</TabsTrigger>
          <TabsTrigger value="terminology" className="gap-1.5"><Languages className="h-3.5 w-3.5" /> Terminology</TabsTrigger>
          <TabsTrigger value="governance" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Governance</TabsTrigger>
        </TabsList>
        <TabsContent value="branding"><BrandingTab key={`b-${orgVersion}`} org={org} onSaved={onSaved} /></TabsContent>
        <TabsContent value="details"><DetailsTab key={`d-${orgVersion}`} org={org} onSaved={onSaved} /></TabsContent>
        <TabsContent value="terminology"><TerminologyTab key={`t-${orgVersion}`} org={org} onSaved={onSaved} /></TabsContent>
        <TabsContent value="governance"><GovernanceTab key={`g-${orgVersion}`} org={org} onSaved={onSaved} /></TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyNoOrg() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-semibold">No organization context</p>
        <p className="mt-1 text-sm text-muted-foreground">Organization settings are available to organization administrators. Platform-wide settings live in the Super Admin console.</p>
      </CardContent>
    </Card>
  );
}
