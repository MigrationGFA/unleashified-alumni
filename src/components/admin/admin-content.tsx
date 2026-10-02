'use client';

// ============================================================
// Admin Content & Engagement hub
// tabs: feed moderation · official news · events · resources
// (ported from stp-admin content-engagement)
// ============================================================
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock, Download, Eye, EyeOff, FileBox, Globe,
  Loader2, Lock, Newspaper, Plus, ShieldCheck, Trash2, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { eventsApi, newsApi, postsApi, resourcesApi, usersApi } from '@/lib/db/client';
import type { OfficialNews } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';
import { formatDate, timeAgo } from '@/lib/format';

// ---------------- Feed moderation tab ----------------
function ModerationTab() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [subFilter, setSubFilter] = useState<'all' | 'reported' | 'hidden'>('all');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['reported-posts', org?.id],
    queryFn: () => postsApi.listReported(org!.id),
    enabled: !!org,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reported-posts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  const hideMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'HIDDEN' }) => postsApi.setVisibility(id, status),
    onSuccess: () => { invalidate(); toast.success('Visibility updated.'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => { invalidate(); toast.success('Post deleted.'); },
  });

  const filtered = posts.filter(p => subFilter === 'all' ? true : subFilter === 'hidden' ? p.status === 'HIDDEN' : p.status !== 'HIDDEN');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([['all', `All flagged (${posts.length})`], ['reported', `Reported (${posts.filter(p => p.status !== 'HIDDEN').length})`], ['hidden', `Hidden (${posts.filter(p => p.status === 'HIDDEN').length})`]] as const).map(([v, label]) => (
          <button
            key={v} onClick={() => setSubFilter(v as typeof subFilter)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${subFilter === v ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
            style={subFilter === v ? { backgroundColor: 'var(--org-primary)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nothing to moderate" description="Reported and hidden posts will appear here for review." />
      ) : (
        <div className="space-y-4">
          {filtered.map(post => {
            const hidden = post.status === 'HIDDEN';
            return (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <PostAuthor authorId={post.authorId} />
                      <span className="text-[11px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
                    </div>
                    {hidden
                      ? <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Hidden</Badge>
                      : <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Reported</Badge>}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm">{post.body}</p>
                  {post.reports[0] && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                      <span className="font-semibold">{post.reports[0].reason}</span>
                      {post.reports[0].description ? ` — ${post.reports[0].description}` : ''}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant={hidden ? 'default' : 'secondary'} onClick={() => hideMutation.mutate({ id: post.id, status: hidden ? 'ACTIVE' : 'HIDDEN' })}>
                      {hidden ? <><Eye className="mr-1.5 h-3.5 w-3.5" /> Unhide post</> : <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Hide post</>}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(post.id)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete permanently
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PostAuthor({ authorId }: { authorId: string }) {
  const { data: author } = useQuery({ queryKey: ['user', authorId], queryFn: () => usersApi.get(authorId) });
  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar user={author} size="sm" />
      <div>
        <p className="text-sm font-semibold leading-tight">{author ? `${author.firstName} ${author.lastName}` : 'Member'}</p>
        <p className="text-[10px] text-muted-foreground">{author?.email}</p>
      </div>
    </div>
  );
}

// ---------------- Official news tab ----------------
function NewsTab() {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [draftOpen, setDraftOpen] = useState(false);
  const [reading, setReading] = useState<OfficialNews | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Announcement');
  const [content, setContent] = useState('');

  const { data: news = [] } = useQuery({
    queryKey: ['news', org?.id],
    queryFn: () => newsApi.list(org!.id),
    enabled: !!org,
  });

  const createMutation = useMutation({
    mutationFn: () => newsApi.create({ orgId: org!.id, authorId: user!.id, title, content, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setDraftOpen(false); setTitle(''); setContent('');
      toast.success('Official news published to the community feed.');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['news'] }); toast.success('News item deleted.'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{news.length} published announcements</p>
        <Button className="gap-1.5" onClick={() => setDraftOpen(true)}><Plus className="h-4 w-4" /> Publish news</Button>
      </div>

      {news.length === 0 ? (
        <EmptyState icon={Newspaper} title="No official news yet" description="Publish announcements that appear in every member's feed." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {news.map(item => (
            <Card key={item.id} className="overflow-hidden">
              {item.coverImage && (
                 
                <img src={item.coverImage} alt={item.title} className="h-32 w-full cursor-pointer object-cover" onClick={() => setReading(item)} />
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="secondary">{item.category}</Badge>
                  <span>{formatDate(item.publishedAt)}</span>
                  <span className="ml-auto">{item.views} reads</span>
                </div>
                <p className="mt-2 line-clamp-2 cursor-pointer text-sm font-bold hover:underline" onClick={() => setReading(item)}>{item.title}</p>
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" onClick={() => setReading(item)}>Read</Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish official news</DialogTitle>
            <DialogDescription>Appears in the Official News tab and the community newsfeed sidebar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headline *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Platform upgrade announcement" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Announcement', 'Platform', 'Community', 'Events', 'Policy'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="Write the announcement…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraftOpen(false)}>Cancel</Button>
            <Button disabled={!title.trim() || content.trim().length < 20 || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reading} onOpenChange={v => !v && setReading(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {reading && (
            <>
              {reading.coverImage && (
                 
                <img src={reading.coverImage} alt={reading.title} className="h-40 w-full rounded-lg object-cover" />
              )}
              <DialogHeader>
                <Badge style={{ backgroundColor: 'var(--org-primary)' }}>{reading.category}</Badge>
                <DialogTitle className="text-left text-lg leading-snug">{reading.title}</DialogTitle>
                <DialogDescription className="text-left">{formatDate(reading.publishedAt)} · {reading.views} reads</DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{reading.content}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Events tab ----------------
function EventsAdminTab() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events', org?.id],
    queryFn: () => eventsApi.listAdmin(org!.id),
    enabled: !!org,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'REJECTED' }) => eventsApi.setStatus(id, status),
    onSuccess: (_d, { status }) => { invalidate(); toast.success(status === 'ACTIVE' ? 'Event approved.' : 'Event declined.'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => { invalidate(); toast.success('Event deleted.'); },
  });

  const filtered = statusFilter === 'all' ? events : events.filter(e => statusFilter === 'pending' ? e.status === 'PENDING_APPROVAL' : e.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([['all', `All (${events.length})`], ['approved', `Approved (${events.filter(e => e.status === 'ACTIVE').length})`], ['pending', `Pending (${events.filter(e => e.status === 'PENDING_APPROVAL').length})`]] as const).map(([v, label]) => (
          <button
            key={v} onClick={() => setStatusFilter(v as typeof statusFilter)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${statusFilter === v ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
            style={statusFilter === v ? { backgroundColor: 'var(--org-primary)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events to show" description="Member-submitted events await approval here." />
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => (
            <Card key={ev.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
                  <span className="text-[9px] font-semibold uppercase opacity-80">{new Date(ev.startTime).toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-none">{new Date(ev.startTime).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold">{ev.name}</p>
                    {ev.status === 'PENDING_APPROVAL' && <Badge variant="secondary" className="gap-1 text-amber-600"><Clock className="h-3 w-3" /> Pending approval</Badge>}
                    {ev.status === 'ACTIVE' && <Badge variant="secondary" className="gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>}
                    <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" /> {ev.visibility.replace('_', ' ').toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formatDate(ev.startTime)} · {ev.type === 'online' ? 'Online' : ev.venue ?? ev.address ?? 'In person'} · {ev.attendeeIds.length}/{ev.capacity} registered
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {ev.status === 'PENDING_APPROVAL' && (
                    <>
                      <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 hover:text-emerald-700" onClick={() => approveMutation.mutate({ id: ev.id, status: 'ACTIVE' })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => approveMutation.mutate({ id: ev.id, status: 'REJECTED' })}>
                        <XCircle className="h-3.5 w-3.5" /> Decline
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(ev.id)} aria-label="Delete event">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Resources tab ----------------
function ResourcesAdminTab() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [sub, setSub] = useState<'official' | 'user' | 'pending'>('official');

  const { data: resources = [] } = useQuery({
    queryKey: ['admin-resources', org?.id],
    queryFn: () => resourcesApi.listAdmin(org!.id),
    enabled: !!org,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => resourcesApi.review(id, action),
    onSuccess: (_d, { action }) => { invalidate(); toast.success(action === 'approve' ? 'Resource approved.' : 'Resource rejected & archived.'); },
  });

  const official = resources.filter(r => r.uploadedBy.includes('admin'));
  const userUploaded = resources.filter(r => !r.uploadedBy.includes('admin') && r.status !== 'PENDING');
  const pending = resources.filter(r => r.status === 'PENDING');
  const shown = sub === 'official' ? official : sub === 'user' ? userUploaded : pending;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([['official', `Official (${official.length})`], ['user', `User uploaded (${userUploaded.length})`], ['pending', `Pending review (${pending.length})`]] as const).map(([v, label]) => (
          <button
            key={v} onClick={() => setSub(v as typeof sub)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${sub === v ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
            style={sub === v ? { backgroundColor: 'var(--org-primary)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={FileBox} title="No resources here" description={sub === 'pending' ? 'Member uploads awaiting review appear here.' : 'Uploads appear here.'} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Visibility</TableHead>
                  <TableHead className="hidden sm:table-cell">Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><FileBox className="h-4 w-4 text-muted-foreground" /></span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{r.fileType} · {timeAgo(r.createdAt)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">{r.category}</TableCell>
                    <TableCell className="hidden text-xs lg:table-cell">
                      <Badge variant="outline" className="gap-1">{r.visibility === 'ALL' ? <><Globe className="h-3 w-3" /> All</> : <><Lock className="h-3 w-3" /> Verified</>}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs tabular-nums sm:table-cell">{r.downloads}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {r.status === 'PENDING' ? (
                          <>
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-600" onClick={() => reviewMutation.mutate({ id: r.id, action: 'approve' })}><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive" onClick={() => reviewMutation.mutate({ id: r.id, action: 'reject' })}><XCircle className="h-3 w-3" /> Reject</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => toast.info('Download simulated (mock).')}><Download className="h-3 w-3" /> Get</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={async () => { await resourcesApi.remove(r.id); invalidate(); toast.success('Resource deleted.'); }} aria-label="Delete resource">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------- Hub ----------------
export function AdminContentView() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Content & Engagement</h1>
        <p className="text-sm text-muted-foreground">Moderate the feed, publish official news, review events and manage resources.</p>
      </div>

      <Tabs defaultValue="moderation">
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="moderation" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Moderation</TabsTrigger>
          <TabsTrigger value="news" className="gap-1.5"><Newspaper className="h-3.5 w-3.5" /> Official News</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Events</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5"><FileBox className="h-3.5 w-3.5" /> Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="moderation"><ModerationTab /></TabsContent>
        <TabsContent value="news"><NewsTab /></TabsContent>
        <TabsContent value="events"><EventsAdminTab /></TabsContent>
        <TabsContent value="resources"><ResourcesAdminTab /></TabsContent>
      </Tabs>
    </div>
  );
}
