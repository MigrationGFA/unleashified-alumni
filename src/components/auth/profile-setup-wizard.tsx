'use client';

// ============================================================
// Profile setup wizard — Personal + Business steps
// (mirrors stp-alumni profile-setup flow)
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Briefcase, Check, Loader2, Plus, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { usersApi } from '@/lib/db/client';
import { useAppStore } from '@/stores/useAppStore';
import { useApp } from '@/components/app/app-context';
import { cn, readFileAsDataUrl } from '@/lib/format';

const SECTORS = ['Technology', 'Financial Services', 'Agriculture', 'Healthcare', 'Education', 'Energy', 'Logistics', 'Media', 'Consumer Goods', 'Real Estate', 'Consulting', 'Legal', 'Tourism', 'Manufacturing'];
const SKILL_SUGGESTIONS = ['Fintech', 'Product Strategy', 'Fundraising', 'Operations', 'Supply Chain', 'Growth Marketing', 'Data', 'Investing', 'Contracts', 'Design Thinking', 'AI/ML', 'Hardware', 'Sales & BD', 'Leadership'];
const BUSINESS_MODELS = ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'D2C', 'Franchise', 'Non-profit', 'Social Enterprise', 'Other'];
const COMPANY_STAGES = ['Idea/Pre-revenue', 'MVP/Early traction', '1-10 employees', '10-50 employees', '50-200 employees', '200+ employees'];
const OFFER_TAGS = ['Fundraising advice', 'Angel investing', 'Technical Co-founder', 'Product strategy', 'Go-to-market', 'Sales & BD', 'Marketing & Growth', 'Legal & Compliance', 'HR & Talent', 'Finance & CFO', 'Design & UX', 'Operations', 'Mentorship', 'Customer introductions', 'Media & PR', 'M&A advisory'];
const NEED_TAGS = ['Technical Co-founder', 'Fundraising', 'Sales leads', 'Strategic partnerships', 'Marketing support', 'Legal advice', 'Hiring support', 'Product feedback', 'Design help', 'Mentorship', 'Investor introductions', 'Market expansion', 'Finance advice', 'Operations help', 'PR & Media', 'Board members'];
const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'Morocco', 'South Africa', 'Egypt', 'Senegal', 'Rwanda', 'Uganda', 'Tanzania', 'United Kingdom', 'United States', 'France', 'UAE', 'Other'];

function TagField({ label, hint, options, selected, onChange, max }: {
  label: string; hint?: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number;
}) {
  const [custom, setCustom] = useState('');
  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter(t => t !== tag));
    else if (!max || selected.length < max) onChange([...selected, tag]);
    else toast.warning(`Maximum ${max} tags.`);
  };
  const addCustom = () => {
    const v = custom.trim();
    if (v && !selected.includes(v) && (!max || selected.length < max)) onChange([...selected, v]);
    setCustom('');
  };
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {max && <span className="text-[11px] text-muted-foreground">{selected.length}/{max}</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(tag => (
          <button
            key={tag} type="button" onClick={() => toggle(tag)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              selected.includes(tag)
                ? 'border-org-primary bg-org-primary text-white'
                : 'border-border bg-background hover:border-org-primary/50 hover:bg-muted/50'
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom} onChange={e => setCustom(e.target.value)}
          placeholder="Add your own…" className="h-8 text-xs"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
        />
        <Button type="button" variant="outline" size="sm" className="h-8 px-2.5" onClick={addCustom}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ProfileSetupWizard() {
  const { session, updateSession } = useAppStore();
  const { org, t } = useApp();
  const [step, setStep] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', cohort: '', node: '', location: '', sectors: [] as string[], skills: [] as string[],
    linkedInProfile: '', goals: '', companyName: '', businessModel: '', companyStage: '',
    elevatorPitch: '', offers: [] as string[], needs: [] as string[],
    contactVisibility: 'EVERYONE' as 'EVERYONE' | 'CONNECTIONS_ONLY' | 'ADMIN_ONLY',
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(f => ({ ...f, [key]: value }));

  const step1Valid = useMemo(() =>
    form.title.trim() && form.location && form.sectors.length > 0 && form.skills.length > 0 && form.goals.trim().length >= 10,
  [form]);

  const mutation = useMutation({
    mutationFn: () => usersApi.setupProfile(session!.userId, {
      title: form.title, cohort: form.cohort, node: form.node, location: form.location,
      sectors: form.sectors, skills: form.skills, linkedInProfile: form.linkedInProfile,
      goals: form.goals, avatarUrl,
      companyName: form.companyName, businessModel: form.businessModel, companyStage: form.companyStage,
      elevatorPitch: form.elevatorPitch, offers: form.offers, needs: form.needs,
      contactVisibility: form.contactVisibility,
    }),
    onSuccess: () => {
      toast.success('Profile complete — welcome to the community!');
      updateSession({ isOnboarded: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = [
    { title: 'Personal information', icon: User, description: `Tell the ${t('community').toLowerCase()} who you are — this powers your directory presence and connection suggestions.` },
    { title: 'Business & marketplace', icon: Briefcase, description: 'Your venture profile powers your marketplace card — what you offer and what you need.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {org ? `You are joining ${org.name}.` : 'Set up your community presence.'}
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-1 items-center gap-2">
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                i < step || step === 1 ? 'border-org-primary bg-org-primary text-white' : i === step ? 'border-org-primary text-org-primary' : 'border-border text-muted-foreground'
              )}>
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              {i === 0 && <div className={cn('h-0.5 flex-1 rounded', step > 0 ? 'bg-org-primary' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{steps[step].title}</CardTitle>
            <CardDescription>{steps[step].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (
                       
                      <img src={avatarUrl} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 2 * 1024 * 1024) {
                          setAvatarUrl(await readFileAsDataUrl(file));
                        } else if (file) toast.error('Image must be under 2MB.');
                      }} />
                      <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted/50">Upload photo</span>
                    </label>
                    {avatarUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setAvatarUrl(null)}>
                        <X className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Job title <span className="text-destructive">*</span></Label>
                    <Input value={form.title} onChange={e => set('title', e.target.value)} maxLength={40} placeholder="e.g. Co-founder & CEO" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('cohort')}</Label>
                    <Input value={form.cohort} onChange={e => set('cohort', e.target.value)} maxLength={20} placeholder={`Your ${t('cohort').toLowerCase()}`} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('node')}</Label>
                    <Input value={form.node} onChange={e => set('node', e.target.value)} maxLength={30} placeholder={`Your ${t('node').toLowerCase()}`} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location <span className="text-destructive">*</span></Label>
                    <Select value={form.location} onValueChange={v => set('location', v)}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TagField label={`Sectors *`} hint="Pick the industries you operate in." options={SECTORS} selected={form.sectors} onChange={v => set('sectors', v)} />
                <TagField label={`Skills *`} hint="What you bring to the community." options={SKILL_SUGGESTIONS} selected={form.skills} onChange={v => set('skills', v)} />

                <div className="space-y-2">
                  <Label>LinkedIn profile</Label>
                  <Input value={form.linkedInProfile} onChange={e => set('linkedInProfile', e.target.value)} placeholder="https://linkedin.com/in/…" />
                </div>

                <div className="space-y-2">
                  <Label>Career goals <span className="text-destructive">*</span></Label>
                  <Textarea value={form.goals} onChange={e => set('goals', e.target.value)} maxLength={120} placeholder="What are you trying to achieve in the next 12 months?" rows={3} />
                  <div className="flex items-center gap-3">
                    <Progress value={Math.min(100, (form.goals.trim().length / 10) * 100)} className="h-1.5 flex-1" />
                    <span className={cn('text-[11px]', form.goals.trim().length >= 10 ? 'text-emerald-600' : 'text-muted-foreground')}>
                      {Math.max(0, 10 - form.goals.trim().length)} chars to go
                    </span>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company name</Label>
                    <Input value={form.companyName} onChange={e => set('companyName', e.target.value)} maxLength={40} placeholder="Powers your marketplace card" />
                  </div>
                  <div className="space-y-2">
                    <Label>Business model</Label>
                    <Select value={form.businessModel} onValueChange={v => set('businessModel', v)}>
                      <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company stage</Label>
                  <Select value={form.companyStage} onValueChange={v => set('companyStage', v)}>
                    <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      {COMPANY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Elevator pitch</Label>
                  <Textarea value={form.elevatorPitch} onChange={e => set('elevatorPitch', e.target.value)} maxLength={120} rows={2} placeholder="One sentence on what your venture does." />
                </div>

                <TagField label="What you OFFER" hint="Services you can provide to other members (max 3)." options={OFFER_TAGS} selected={form.offers} onChange={v => set('offers', v)} max={3} />
                <TagField label="What you NEED" hint="Support you are looking for (max 3)." options={NEED_TAGS} selected={form.needs} onChange={v => set('needs', v)} max={3} />

                <div className="space-y-2.5 rounded-xl border bg-muted/30 p-4">
                  <Label>Contact visibility</Label>
                  <p className="text-xs text-muted-foreground">Who can see your email and phone number.</p>
                  <RadioGroup value={form.contactVisibility} onValueChange={v => set('contactVisibility', v as typeof form.contactVisibility)} className="gap-2.5">
                    {[
                      { value: 'EVERYONE', label: 'All members', desc: 'Maximum discoverability' },
                      { value: 'CONNECTIONS_ONLY', label: 'Connections only', desc: 'Only accepted connections' },
                      { value: 'ADMIN_ONLY', label: 'Admins only', desc: 'Most private' },
                    ].map(opt => (
                      <label key={opt.value} className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                        form.contactVisibility === opt.value ? 'border-org-primary bg-background shadow-sm' : 'border-transparent hover:border-border'
                      )}>
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-medium">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step === 0 ? (
                <Button disabled={!step1Valid} onClick={() => setStep(1)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button disabled={!step1Valid || mutation.isPending} onClick={() => mutation.mutate()}>
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish setup <Check className="ml-2 h-4 w-4" /></>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
