'use client';

// ============================================================
// Member profile page
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Briefcase, Building2, Globe, GraduationCap, Linkedin, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { connectionsApi, postsApi, usersApi } from '@/lib/db/client';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PostCard } from '@/components/member/post-card';
import { ROLE_LABELS } from '@/lib/format';

export function ProfileView({ userId }: { userId: string }) {
  const { user, org, t } = useApp();
  const navigate = useAppStore(s => s.navigate);

  const { data: profileUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.get(userId),
    enabled: !!userId,
  });
  const { data: connections = [] } = useQuery({
    queryKey: ['connections', user?.id],
    queryFn: () => connectionsApi.network(org!.id, user!.id),
    enabled: !!user?.id && !!org,
  });
  const { data: myPosts = [] } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: () => postsApi.listMyPosts(userId),
    enabled: !!userId,
  });

  if (!profileUser) return null;
  const p = profileUser.profile;
  const isMe = profileUser.id === user?.id;

  const conn = connections.find(c =>
    (c.requesterId === profileUser.id && c.recipientId === user?.id) || (c.recipientId === profileUser.id && c.requesterId === user?.id));
  const isConnected = conn?.status === 'ACCEPTED';
  const canSeeContact = isMe || isConnected || p.contactVisibility === 'EVERYONE' || (user?.role !== 'MEMBER' && p.contactVisibility !== 'ADMIN_ONLY');

  const connectionCount = connections.filter(c =>
    (c.requesterId === profileUser.id || c.recipientId === profileUser.id) && c.status === 'ACCEPTED').length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {!isMe && (
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate('network')} className="mb-4 text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back
        </button>
      )}

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="h-28" style={{ background: `linear-gradient(120deg, ${org?.colors.primary ?? '#1B2F5B'}, ${org?.colors.secondary ?? '#233389'})` }}>
          <div className="flex h-full items-end justify-between px-6 pb-4">
            {p.cohort && <Badge variant="secondary" className="bg-white/90 text-gray-900">{t('cohort')}: {p.cohort}</Badge>}
            <Badge variant="secondary" className="bg-white/90 text-gray-900">{ROLE_LABELS[profileUser.role] ?? 'Member'}</Badge>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="rounded-full border-4 border-card">
              <UserAvatar user={profileUser} size="xl" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{profileUser.firstName} {profileUser.lastName}</h1>
                {profileUser.isVerified && <Badge variant="secondary" className="gap-1 text-emerald-600"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.title ?? 'Member'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.location && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> {p.location}</Badge>}
                {p.node && <Badge variant="outline">{t('node')}: {p.node}</Badge>}
                {p.sectors.slice(0, 3).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <Button variant="outline" onClick={() => navigate('settings')}>Edit profile</Button>
              ) : (
                <>
                  <Button variant="outline" className="gap-1.5" onClick={() => navigate('messaging', { id: profileUser.id })}>
                    <Mail className="h-4 w-4" /> Message
                  </Button>
                  {!isConnected && (
                    <Button className="gap-1.5" onClick={() => navigate('network')}>
                      <Sparkles className="h-4 w-4" /> Connect
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
            <div><p className="text-lg font-bold">{connectionCount}</p><p className="text-[11px] text-muted-foreground">Connections</p></div>
            <div><p className="text-lg font-bold">{myPosts.length}</p><p className="text-[11px] text-muted-foreground">Posts</p></div>
            <div><p className="text-lg font-bold">{p.offers.length + p.needs.length}</p><p className="text-[11px] text-muted-foreground">Marketplace tags</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          {/* Business card */}
          {(p.companyName || p.elevatorPitch || p.businessModel || p.companyStage) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Briefcase className="h-4 w-4 text-org-primary" /> Business</h3>
                <div className="space-y-2.5 text-sm">
                  {p.companyName && (
                    <p className="flex items-center gap-2"><Building2 className="h-4 w-4 shrink-0 text-muted-foreground" /> <span className="font-medium">{p.companyName}</span></p>
                  )}
                  {p.businessModel && (
                    <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0 text-muted-foreground" /> {p.businessModel}{p.companyStage ? ` · ${p.companyStage}` : ''}</p>
                  )}
                  {p.elevatorPitch && <p className="rounded-lg bg-muted/40 p-3 text-xs italic leading-relaxed text-muted-foreground">“{p.elevatorPitch}”</p>}
                  {p.companyWebsite && (
                    <a href={p.companyWebsite} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-medium text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" /> {p.companyWebsite.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marketplace tags */}
          {(p.offers.length > 0 || p.needs.length > 0) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-bold">Give & Get</h3>
                {p.offers.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" /> Offers</p>
                    <div className="flex flex-wrap gap-1">
                      {p.offers.map(o => <Badge key={o} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300">{o}</Badge>)}
                    </div>
                  </div>
                )}
                {p.needs.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600"><ArrowDownLeft className="h-3.5 w-3.5" /> Looking for</p>
                    <div className="flex flex-wrap gap-1">
                      {p.needs.map(n => <Badge key={n} variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">{n}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Skills & goals */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-bold">Skills & Goals</h3>
              <div className="flex flex-wrap gap-1">
                {p.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
                {p.skills.length === 0 && <p className="text-xs text-muted-foreground">No skills listed yet.</p>}
              </div>
              {p.goals && (
                <div className="mt-3 rounded-lg bg-muted/40 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Career goals</p>
                  <p className="text-xs leading-relaxed">{p.goals}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-bold">Contact</h3>
              {canSeeContact ? (
                <div className="space-y-2.5 text-sm">
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span className="truncate">{profileUser.email}</span></p>
                  {p.linkedInProfile && (
                    <a href={p.linkedInProfile} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium text-primary hover:underline">
                      <Linkedin className="h-4 w-4" /> LinkedIn profile
                    </a>
                  )}
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Visibility: {p.contactVisibility.replace('_', ' ').toLowerCase()}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Contact details hidden — visible to {p.contactVisibility === 'CONNECTIONS_ONLY' ? 'accepted connections only' : 'administrators only'}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold"><GraduationCap className="h-4 w-4 text-org-primary" /> Posts by {profileUser.firstName}</h2>
          {myPosts.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-xs text-muted-foreground">No community posts yet.</CardContent></Card>
          ) : (
            myPosts.map(post => <PostCard key={post.id} post={post} onNavigateToProfile={id => navigate('profile', { id })} />)
          )}
        </div>
      </div>
    </div>
  );
}
