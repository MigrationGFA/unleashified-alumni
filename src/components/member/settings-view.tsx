'use client';

// ============================================================
// Settings — profile / posts / saved / security / preferences
// ============================================================
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bookmark, Eye, EyeOff, KeyRound, Loader2, Lock, Newspaper, Save, ShieldAlert, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authApi, postsApi, usersApi } from '@/lib/db/client';
import type { User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { PostCard } from '@/components/member/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { readFileAsDataUrl, visibilityLabel } from '@/lib/format';

const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'Morocco', 'South Africa', 'Egypt', 'Senegal', 'Rwanda', 'Uganda', 'Tanzania', 'United Kingdom', 'United States', 'France', 'UAE', 'Other'];

export function SettingsView() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('profile');

  const refetchUser = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['directory'] });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, content, security and preferences.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="profile" className="gap-1.5"><UserIcon className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5"><Newspaper className="h-3.5 w-3.5" /> Posts</TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5"><Bookmark className="h-3.5 w-3.5" /> Saved</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileTab onSaved={refetchUser} /></TabsContent>
        <TabsContent value="posts"><MyPostsTab /></TabsContent>
        <TabsContent value="saved"><SavedPostsTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="preferences"><PreferencesTab onSaved={refetchUser} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- Profile tab ----------------
function ProfileTab({ onSaved }: { onSaved: () => void }) {
  const { user, t } = useApp();
  const p = user?.profile;
  const [title, setTitle] = useState(p?.title ?? '');
  const [location, setLocation] = useState(p?.location ?? '');
  const [goals, setGoals] = useState(p?.goals ?? '');
  const [linkedIn, setLinkedIn] = useState(p?.linkedInProfile ?? '');
  const [companyName, setCompanyName] = useState(p?.companyName ?? '');
  const [elevatorPitch, setElevatorPitch] = useState(p?.elevatorPitch ?? '');
  const [visibility, setVisibility] = useState(p?.contactVisibility ?? 'EVERYONE');
  const [avatarUrl, setAvatarUrl] = useState(p?.avatarUrl ?? null);

  const mutation = useMutation({
    mutationFn: () => usersApi.setupProfile(user!.id, {
      title, location, goals, linkedInProfile: linkedIn, companyName, elevatorPitch,
      contactVisibility: visibility, avatarUrl,
    }),
    onSuccess: () => { onSaved(); toast.success('Profile updated.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
          <CardDescription>
            Immutable fields — {t('cohort').toLowerCase()}, {t('node').toLowerCase()} and name — are locked by administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar user={{ ...user, profile: { ...user.profile, avatarUrl } }} size="xl" />
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 2 * 1024 * 1024) setAvatarUrl(await readFileAsDataUrl(file));
                  else if (file) toast.error('Image must be under 2MB.');
                }} />
                <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted/50">Change photo</span>
              </label>
              {avatarUrl && <Button variant="ghost" size="sm" onClick={() => setAvatarUrl(null)}>Remove</Button>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Job title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={40} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={location || undefined} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('cohort')} <span className="text-[10px] text-muted-foreground">(locked)</span></Label>
              <Input value={p?.cohort ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('node')} <span className="text-[10px] text-muted-foreground">(locked)</span></Label>
              <Input value={p?.node ?? '—'} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Career goals</Label>
            <Textarea value={goals} onChange={e => setGoals(e.target.value)} rows={2} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>LinkedIn profile</Label>
            <Input value={linkedIn} onChange={e => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business profile</CardTitle>
          <CardDescription>Powers your marketplace card.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} maxLength={40} />
            </div>
            <div className="space-y-2">
              <Label>Contact visibility</Label>
              <Select value={visibility} onValueChange={v => setVisibility(v as typeof visibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVERYONE">{visibilityLabel('EVERYONE')}</SelectItem>
                  <SelectItem value="CONNECTIONS_ONLY">{visibilityLabel('CONNECTIONS_ONLY')}</SelectItem>
                  <SelectItem value="ADMIN_ONLY">{visibilityLabel('ADMIN_ONLY')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Elevator pitch</Label>
            <Textarea value={elevatorPitch} onChange={e => setElevatorPitch(e.target.value)} rows={2} maxLength={120} />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-1.5">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Posts tabs ----------------
function MyPostsTab() {
  const { user } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const { data: posts = [] } = useQuery({
    queryKey: ['my-posts', user?.id],
    queryFn: () => postsApi.listMyPosts(user!.id),
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You have not posted yet. Share something on the newsfeed!</CardContent></Card>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onNavigateToProfile={id => navigate('profile', { id })} />
        ))
      )}
    </div>
  );
}

function SavedPostsTab() {
  const { user } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const { data: posts = [] } = useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: () => postsApi.listSaved(user!.id),
    enabled: !!user?.id,
  });
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No saved posts. Bookmark posts from the newsfeed to find them here.</CardContent></Card>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onNavigateToProfile={id => navigate('profile', { id })} />
        ))
      )}
    </div>
  );
}

// ---------------- Security tab ----------------
function SecurityTab() {
  const { user } = useApp();
  const setSession = useAppStore(s => s.setSession);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const changeMutation = useMutation({
    mutationFn: () => authApi.changePassword(user!.id, oldPassword, newPassword),
    onSuccess: (session) => {
      toast.success('Password changed successfully.');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      useAppStore.getState().updateSession({ passwordChangeRequired: false });
      void session;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => usersApi.deactivateAccount(user!.id),
    onSuccess: () => {
      toast.info('Account deactivated — your identity has been anonymized.');
      setSession(null);
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>Use at least 8 characters with upper, lower, number and special character.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <div className="relative">
              <Input type={show ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="pr-9" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShow(v => !v)} aria-label="toggle visibility">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <Button
            disabled={!oldPassword || newPassword.length < 8 || newPassword !== confirmPassword || changeMutation.isPending}
            onClick={() => changeMutation.mutate()} className="gap-1.5"
          >
            {changeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4" /> Update password</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive"><ShieldAlert className="h-4 w-4" /> Deactivate account</CardTitle>
          <CardDescription>
            Soft-deletion anonymizes your identity while preserving community discussions. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deactivateOpen ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <p className="flex-1 text-sm font-medium">Are you absolutely sure?</p>
              <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate()}>
                {deactivateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, deactivate'}
              </Button>
            </div>
          ) : (
            <Button variant="destructive" className="gap-1.5" onClick={() => setDeactivateOpen(true)}>
              <Lock className="h-4 w-4" /> Deactivate my account
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Preferences tab ----------------
function PreferencesTab({ onSaved }: { onSaved: () => void }) {
  const { user } = useApp();
  const [language, setLanguage] = useState(user?.language ?? 'en');
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);

  const mutation = useMutation({
    mutationFn: () => usersApi.update(user!.id, { language: language as User['language'], emailNotifications }),
    onSuccess: () => { onSaved(); toast.success('Preferences saved.'); },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
        <CardDescription>Interface language and notification settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'fr' | 'ar')}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français (mock)</SelectItem>
              <SelectItem value="ar">العربية (mock)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">Full i18n (EN/FR/AR + RTL) is planned from the original stp-alumni architecture.</p>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted-foreground">Connection requests, comments and event updates.</p>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-1.5">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save preferences</>}
        </Button>
      </CardContent>
    </Card>
  );
}
