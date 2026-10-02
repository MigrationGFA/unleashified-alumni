'use client';

// ============================================================
// Support — member ticket submission
// ============================================================
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, HelpCircle, Loader2, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supportApi } from '@/lib/db/client';
import { useApp } from '@/components/app/app-context';

const FAQS = [
  { q: 'How do I get verified?', a: 'Verification is handled by your organization administrators after onboarding. Complete your profile to speed things up.' },
  { q: 'Why can\'t I see contact details on profiles?', a: 'Members control their contact visibility in Settings → Profile. Connect with them to unlock details.' },
  { q: 'How do deal room NDAs work?', a: 'Each deal room requires a signed NDA before content becomes visible. Signatures are timestamped in the audit trail.' },
  { q: 'Can I join another organization\'s community?', a: 'Accounts are scoped to a single organization. Ask your target community\'s admin to provision an account for you.' },
];

export function SupportView() {
  const { user, org } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => supportApi.createTicket({ orgId: org!.id, userId: user!.id, subject: subject.trim(), message: message.trim() }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Support request submitted — your admins have been notified.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </span>
        <h1 className="mt-4 text-xl font-bold">Request submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your {org?.terminology.community.toLowerCase() === 'network' ? 'network' : 'community'} admin team typically responds within one business day. You will be notified in-app.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); }}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground">Submit a request to your organization&apos;s admin team.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Submit a support request</CardTitle>
          <CardDescription>Your name and email are attached automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Input value={user ? `${user.firstName} ${user.lastName}` : ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary of your issue" maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Describe the issue in detail (minimum 10 characters)…" />
            <p className={`text-[11px] ${message.trim().length >= 10 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {Math.max(0, 10 - message.trim().length)} characters minimum
            </p>
          </div>
          <Button className="gap-1.5" disabled={!subject.trim() || message.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit request'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="h-4 w-4 text-org-primary" /> Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FAQS.map(faq => (
            <details key={faq.q} className="group rounded-lg border px-4 py-3 open:bg-muted/30">
              <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                <span className="flex items-center justify-between gap-2">
                  {faq.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
