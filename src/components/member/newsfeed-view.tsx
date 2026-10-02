'use client';

// ============================================================
// Newsfeed — social feed + official news
// ============================================================
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Eye, FileText, Loader2, Newspaper, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { postsApi, newsApi, usersApi } from '@/lib/db/client';
import type { OfficialNews } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { PostCard, CreatePostComposer } from '@/components/member/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';
import { formatDate, timeAgo } from '@/lib/format';

function NewsCard({ item, onOpen }: { item: OfficialNews; onOpen: () => void }) {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={onOpen}>
      <div className="relative">
        {item.coverImage ? (
           
          <img src={item.coverImage} alt={item.title} className="h-36 w-full object-cover" />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-org-primary to-org-secondary text-white">
            <Newspaper className="h-8 w-8 opacity-60" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 shadow" style={{ backgroundColor: 'var(--org-primary)' }}>{item.category}</Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:underline">{item.title}</h3>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(item.publishedAt)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.views} reads</span>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsDialog({ item, onOpenChange }: { item: OfficialNews | null; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [lastOpenedId, setLastOpenedId] = useState('');
  const { data: author } = useQuery({
    queryKey: ['user', item?.authorId],
    queryFn: () => usersApi.get(item!.authorId),
    enabled: !!item,
  });

  return (
    <Dialog open={!!item} onOpenChange={open => {
      onOpenChange(open);
      if (open && item && lastOpenedId !== item.id) {
        setLastOpenedId(item.id);
        newsApi.incrementViews(item.id).then(() => queryClient.invalidateQueries({ queryKey: ['news'] }));
      }
    }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {item && (
          <>
            {item.coverImage && (
               
              <img src={item.coverImage} alt={item.title} className="h-48 w-full rounded-lg object-cover" />
            )}
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: 'var(--org-primary)' }}>{item.category}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(item.publishedAt)} · {item.views} reads</span>
              </div>
              <DialogTitle className="text-left text-lg leading-snug">{item.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-left">
                <UserAvatar user={author} size="xs" />
                <span>Official Publisher — {author ? `${author.firstName} ${author.lastName}` : 'Administrator'}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{item.content}</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NewsfeedView() {
  const { user, org, t } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const [tab, setTab] = useState<'feed' | 'news'>('feed');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [openNews, setOpenNews] = useState<OfficialNews | null>(null);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['feed', org?.id],
    queryFn: () => postsApi.listFeed(org!.id),
    enabled: !!org,
  });
  const { data: news = [] } = useQuery({
    queryKey: ['news', org?.id],
    queryFn: () => newsApi.list(org!.id),
    enabled: !!org,
  });

  const categories = useMemo(() => ['all', ...new Set(posts.map(p => p.category).filter(Boolean) as string[])], [posts]);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.body.toLowerCase().includes(q));
    }
    return list;
  }, [posts, category, search]);

  const filteredNews = useMemo(() => {
    if (!search.trim()) return news;
    const q = search.toLowerCase();
    return news.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [news, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsfeed</h1>
          <p className="text-sm text-muted-foreground">
            {tab === 'feed'
              ? `Community updates from your ${t('community').toLowerCase()}`
              : 'Official announcements from administrators'}
          </p>
        </div>
        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-2 sm:w-72">
            <TabsTrigger value="feed" className="gap-1.5"><Newspaper className="h-3.5 w-3.5" /> Community Feed</TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Official News</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts and announcements…" className="pl-9" />
        </div>
        {tab === 'feed' && categories.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${category === c ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'feed' ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {user?.role !== 'SUPERADMIN' && <CreatePostComposer />}
            {postsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredPosts.length === 0 ? (
              <EmptyState icon={Newspaper} title="No posts found" description={search ? 'Try a different search or clear the filters.' : 'Be the first to share an update with the community.'} />
            ) : (
              filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onNavigateToProfile={userId => navigate('profile', { id: userId })} />
              ))
            )}
          </div>

          <aside className="hidden space-y-4 lg:block">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-org-accent" />
                  <h3 className="text-sm font-bold">Hot Topics</h3>
                </div>
                <div className="space-y-2.5">
                  {[...new Set(posts.flatMap(p => p.category ? [p.category] : []))].slice(0, 5).map((cat, i) => (
                    <button key={cat} onClick={() => setCategory(cat)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-muted/60">
                      <span className="flex items-center gap-2 text-xs font-medium">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                        {cat}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{posts.filter(p => p.category === cat).length} posts</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-bold">Latest Announcement</h3>
                {news[0] && (
                  <button onClick={() => setOpenNews(news[0])} className="w-full text-left">
                    <p className="line-clamp-2 text-xs font-medium hover:underline">{news[0].title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(news[0].publishedAt)} · {news[0].views} reads</p>
                  </button>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState icon={FileText} title="No official news yet" description="Announcements published by administrators will appear here." />
            </div>
          ) : (
            filteredNews.map(item => <NewsCard key={item.id} item={item} onOpen={() => setOpenNews(item)} />)
          )}
        </div>
      )}

      <NewsDialog item={openNews} onOpenChange={() => setOpenNews(null)} />
    </div>
  );
}
