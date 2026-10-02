'use client';

// ============================================================
// Resources — curated knowledge base
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Download, FileText, Film, GraduationCap, Loader2, Plus, Search, ScrollText, Share2, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resourcesApi } from '@/lib/db/client';
import type { ResourceCategory } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { EmptyState } from '@/components/shared/primitives';
import { timeAgo } from '@/lib/format';

const CATEGORIES: { value: ResourceCategory | 'all'; label: string; icon: typeof FileText; color: string }[] = [
  { value: 'all', label: 'All', icon: BookOpen, color: 'text-muted-foreground bg-muted' },
  { value: 'guides', label: 'Guides', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
  { value: 'trainingMaterials', label: 'Training', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
  { value: 'templates', label: 'Templates', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  { value: 'policies', label: 'Policies', icon: ScrollText, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
  { value: 'sharedDocs', label: 'Shared docs', icon: Share2, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
  { value: 'videos', label: 'Videos', icon: Film, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50' },
];

export function ResourcesView() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources', org?.id],
    queryFn: () => resourcesApi.list(org!.id),
    enabled: !!org,
  });

  const filtered = useMemo(() => {
    let list = resources;
    if (category !== 'all') list = list.filter(r => r.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return list;
  }, [resources, category, search]);

  const downloadMutation = useMutation({
    mutationFn: (id: string) => resourcesApi.download(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Download started (mock) — download count tracked.');
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>
          <p className="text-sm text-muted-foreground">Guides, playbooks, templates and training materials from your community.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setUploadOpen(true)}><Plus className="h-4 w-4" /> Share a resource</Button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…" className="pl-9" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${category === c.value ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
            >
              <c.icon className="h-3.5 w-3.5" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No resources found" description="Try a different category, or share the first resource with your community." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(r => {
            const cat = CATEGORIES.find(c => c.value === r.category) ?? CATEGORIES[0];
            return (
              <Card key={r.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.color}`}>
                      {r.isVideo ? <Film className="h-5 w-5" /> : <cat.icon className="h-5 w-5" />}
                    </span>
                    <Badge variant="secondary" className="shrink-0">{cat.label}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-bold leading-snug">{r.title}</p>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-xs text-muted-foreground">{r.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-[11px] text-muted-foreground">
                      {r.fileType} · {r.downloads} downloads · {timeAgo(r.createdAt)}
                    </span>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadMutation.mutate(r.id)}>
                      {r.isVideo ? <Film className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                      {r.isVideo ? 'Watch' : 'Get'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <UploadResourceDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

function UploadResourceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('guides');
  const [visibility, setVisibility] = useState<'ALL' | 'VERIFIED'>('ALL');

  const mutation = useMutation({
    mutationFn: () => resourcesApi.create({ orgId: org!.id, uploadedBy: user!.id, title, description, category, visibility }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      onOpenChange(false); setTitle(''); setDescription('');
      toast[res.status === 'PENDING' ? 'info' : 'success'](res.status === 'PENDING' ? 'Submitted for admin review.' : 'Resource published.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share a resource</DialogTitle>
          <DialogDescription>Upload guides, templates or recordings for the community. Member uploads are reviewed by admins.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Term Sheet Negotiation Checklist" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What is inside and who is it for?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={v => setCategory(v as ResourceCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={v => setVisibility(v as 'ALL' | 'VERIFIED')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All members</SelectItem>
                  <SelectItem value="VERIFIED">Verified only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            <Wrench className="h-4 w-4" />
            File upload simulated in mock mode — metadata is recorded.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Share resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
