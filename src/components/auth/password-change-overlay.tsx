'use client';

// ============================================================
// Blocking password-change overlay (admin-provisioned temp creds)
// ============================================================
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { authApi } from '@/lib/db/client';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/format';

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordChangeOverlay() {
  const { session, setSession, updateSession } = useAppStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(session!.userId, oldPassword, newPassword),
    onSuccess: (updated) => {
      toast.success('Password updated successfully.');
      updateSession({ passwordChangeRequired: false });
      setSession(updated);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passed = RULES.filter(r => r.test(newPassword)).length;
  const allValid = passed === RULES.length && newPassword === confirmPassword && newPassword !== oldPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-4">
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-xl font-bold">Set your new password</CardTitle>
            <CardDescription>
              You signed in with a temporary password provisioned by your administrator.
              Choose a permanent password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Temporary password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type={show ? 'text' : 'password'} className="pl-9 pr-9" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="The password you signed in with" />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="toggle visibility">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type={show ? 'text' : 'password'} className="pl-9" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <Progress value={(passed / RULES.length) * 100} className="h-1.5" />
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {RULES.map(rule => {
                  const ok = rule.test(newPassword);
                  return (
                    <li key={rule.label} className={cn('flex items-center gap-1.5 text-[11px]', ok ? 'text-emerald-600' : 'text-muted-foreground')}>
                      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" className="pl-9" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              )}
            </div>

            <Button className="w-full" size="lg" disabled={!allValid || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save new password'}
            </Button>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setSession(null)}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out instead
          </Button>
        </div>
      </div>
    </div>
  );
}
