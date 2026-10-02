'use client';

// ============================================================
// Login / Forgot Password / Reset Password — mock flows
// ============================================================
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ArrowLeft, ShieldCheck, Building2, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, type SessionUser } from '@/lib/db/client';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/format';

const DEMO_ACCOUNTS: { label: string; email: string; role: string; desc: string; icon: typeof ShieldCheck; color: string }[] = [
  { label: 'Super Admin', email: 'super@unleashified.io', role: 'SUPERADMIN', desc: 'Platform oversight, provisions organizations', icon: ShieldCheck, color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  { label: 'Org Admin — STP', email: 'admin@stp.org', role: 'ADMIN', desc: 'Manages one organization, branding & members', icon: Building2, color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  { label: 'Member — STP', email: 'amara@stp.org', role: 'MEMBER', desc: 'Full community experience', icon: Users, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { label: 'New Member (setup flow)', email: 'tunde@stp.org', role: 'MEMBER', desc: 'Temp password + onboarding wizard demo', icon: Sparkles, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
];

function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] flex-col justify-between p-10 text-white" style={{ background: 'linear-gradient(135deg, #14224A 0%, #1B2F5B 45%, #233389 100%)' }}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#ED202D]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-16 top-1/3 h-40 w-40 rounded-full bg-[#FBAD17]/20 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg font-black backdrop-blur">UA</div>
        <div>
          <p className="text-lg font-bold leading-tight">Unleashified</p>
          <p className="text-xs text-white/60">Alumni Platform</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <h1 className="text-3xl font-bold leading-tight">
          One platform.<br />Every alumni community.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          A single codebase uniting the admin backoffice and the member portal. Organizations provision their own
          branded workspace — logo, colors, terminology and roster — while members enjoy the full community experience.
        </p>
        <div className="mt-8 space-y-3">
          {[
            'Multi-tenant: onboard alumni from any institution or community',
            'Community-level branding, terminology and administrators',
            'Super admin · Organization admin · Member — role-based access',
          ].map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FBAD17]/20">
                <ShieldCheck className="h-3 w-3 text-[#FBAD17]" />
              </span>
              <span className="text-white/80">{line}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-white/40">Closed ecosystem — accounts are provisioned by administrators.</p>
    </div>
  );
}

export function LoginView() {
  const setSession = useAppStore(s => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetStage, setResetStage] = useState<'form' | 'done'>('form');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (session: SessionUser) => {
      setSession(session);
      toast.success(`Welcome back, ${session.name.split(' ')[0]}!`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const forgotMutation = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email),
    onSuccess: () => setResetStage('done'),
  });

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword('mock-token', newPassword),
    onSuccess: () => {
      toast.success('Password updated. Sign in with your new password.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickFill = (acc: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(acc.email);
    setPassword('demo1234');
    setMode('login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AuthAside />

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {mode === 'login' && (
            <Card className="border-border/60 shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-bold">Sign in</CardTitle>
                <CardDescription>Access your workspace with your provisioned credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email" type="email" autoComplete="email" placeholder="you@organization.org"
                      className="pl-9" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loginMutation.mutate()}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                      placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loginMutation.mutate()}
                    />
                    <button
                      type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full" size="lg"
                  disabled={loginMutation.isPending || !email || !password}
                  onClick={() => loginMutation.mutate()}
                >
                  {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
                </Button>

                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Demo accounts (password: demo1234)</p>
                  <div className="grid gap-2">
                    {DEMO_ACCOUNTS.map(acc => (
                      <button
                        key={acc.email} type="button" onClick={() => quickFill(acc)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:shadow-sm',
                          email === acc.email ? 'border-ring bg-background ring-1 ring-ring' : 'border-transparent hover:border-border'
                        )}
                      >
                        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', acc.color)}>
                          <acc.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">{acc.label}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{acc.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'forgot' && (
            <Card className="border-border/60 shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-bold">Reset your password</CardTitle>
                <CardDescription>Enter your email and we will send a reset link (simulated).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resetStage === 'form' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="forgot-email" type="email" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@organization.org" />
                      </div>
                    </div>
                    <Button className="w-full" size="lg" disabled={forgotMutation.isPending || !email} onClick={() => forgotMutation.mutate()}>
                      {forgotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
                      <Mail className="h-6 w-6 text-emerald-600" />
                    </span>
                    <p className="mt-3 font-semibold">Check your email</p>
                    <p className="mt-1 text-sm text-muted-foreground">If an account exists for {email || 'your address'}, a reset link is on its way.</p>
                  </div>
                )}
                <Button variant="ghost" className="w-full" onClick={() => { setMode('login'); setResetStage('form'); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                </Button>
              </CardContent>
            </Card>
          )}

          {mode === 'reset' && (
            <Card className="border-border/60 shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-bold">Set a new password</CardTitle>
                <CardDescription>Choose a strong password of at least 8 characters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="new-password" type="password" className="pl-9" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirm-password" type="password" className="pl-9" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <Button
                  className="w-full" size="lg"
                  disabled={resetMutation.isPending || newPassword.length < 8 || newPassword !== confirmPassword}
                  onClick={() => resetMutation.mutate()}
                >
                  {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode('login')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                </Button>
              </CardContent>
            </Card>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Mocked frontend · JSON text-DB · No backend required
          </p>
        </div>
      </div>
    </div>
  );
}
