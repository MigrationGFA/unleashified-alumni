'use client';

// ============================================================
// PostCard — social feed post with like/comment/save/report
// ============================================================
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bookmark, BookmarkCheck, Flag, Heart, Link2, Loader2, MessageCircle, MoreHorizontal, Pencil, Send, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { postsApi, usersApi } from '@/lib/db/client';
import type { Post, User } from '@/lib/db/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn, readFileAsDataUrl, timeAgo } from '@/lib/format';
import { useApp } from '@/components/app/app-context';

interface PostCardProps {
  post: Post;
  onNavigateToProfile?: (userId: string) => void;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or fraudulent content' },
  { value: 'HARASSMENT', label: 'Harassment or defamation' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'OTHER', label: 'Other (describe below)' },
] as const;

export function PostCard({ post, onNavigateToProfile }: PostCardProps) {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('SPAM');
  const [reportDesc, setReportDesc] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: author } = useQuery({
    queryKey: ['user', post.authorId],
    queryFn: () => usersApi.get(post.authorId),
    staleTime: 60_000,
  });

  const { data: commentAuthors = {} } = useQuery({
    queryKey: ['comment-authors', post.id],
    queryFn: async () => {
      const ids = [...new Set(post.comments.map(c => c.authorId))];
      const users = await Promise.all(ids.map(id => usersApi.get(id)));
      return Object.fromEntries(users.filter(Boolean).map(u => [u!.id, u])) as Record<string, User>;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    queryClient.invalidateQueries({ queryKey: ['my-posts'] });
    queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
    queryClient.invalidateQueries({ queryKey: ['post', post.id] });
  };

  const likeMutation = useMutation({
    mutationFn: () => postsApi.toggleLike(post.id, user!.id),
    onSuccess: invalidate,
  });
  const saveMutation = useMutation({
    mutationFn: () => postsApi.toggleSave(post.id, user!.id),
    onSuccess: invalidate,
  });
  const commentMutation = useMutation({
    mutationFn: () => postsApi.addComment(post.id, user!.id, commentText.trim()),
    onSuccess: () => { setCommentText(''); invalidate(); },
  });
  const reportMutation = useMutation({
    mutationFn: () => postsApi.report(post.id, user!.id, reportReason as Post['reports'][number]['reason'], reportDesc || undefined),
    onSuccess: () => { setReportOpen(false); setReportDesc(''); invalidate(); toast.success('Report submitted — moderators will review this post.'); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => postsApi.delete(post.id),
    onSuccess: () => { invalidate(); toast.success('Post deleted.'); },
  });
  const editMutation = useMutation({
    mutationFn: () => postsApi.update(post.id, editBody),
    onSuccess: () => { setEditOpen(false); invalidate(); toast.success('Post updated.'); },
  });

  const liked = post.likedBy.includes(user?.id ?? '');
  const saved = post.savedBy.includes(user?.id ?? '');
  const isAuthor = post.authorId === user?.id;
  const longPost = post.body.length > 320;
  const visibleBody = longPost && !expanded ? post.body.slice(0, 320) + '…' : post.body;

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/post/${post.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success('Link copied to clipboard.'));
  };

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', post.status === 'HIDDEN' && 'opacity-70')}>
      {post.status === 'HIDDEN' && (
        <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          This post is hidden by moderators — only visible here for context.
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => onNavigateToProfile?.(post.authorId)}>
            <UserAvatar user={author} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold hover:underline">
                {author ? `${author.firstName} ${author.lastName}` : 'Member'}
                {isAuthor && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">You</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {author?.profile?.title ?? 'Member'}{author?.profile?.companyName ? ` · ${author.profile.companyName}` : ''} · {timeAgo(post.createdAt)}
              </p>
            </div>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Post options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copyLink}>
                <Link2 className="mr-2 h-4 w-4" /> Copy link
              </DropdownMenuItem>
              {isAuthor && (
                <>
                  <DropdownMenuItem onClick={() => { setEditBody(post.body); setEditOpen(true); }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete post
                  </DropdownMenuItem>
                </>
              )}
              {!isAuthor && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setReportOpen(true)}>
                    <Flag className="mr-2 h-4 w-4" /> Report post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{visibleBody}</p>
        {longPost && (
          <button onClick={() => setExpanded(v => !v)} className="mt-1 text-xs font-medium text-primary hover:underline">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {post.imageUrls.length > 0 && (
          <div className={cn('mt-3 grid gap-2', post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {post.imageUrls.map((url, i) => (
               
              <img key={i} src={url} alt={`Post attachment ${i + 1}`} className="w-full rounded-lg object-cover" style={{ maxHeight: post.imageUrls.length > 1 ? 220 : 360 }} />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t px-2 py-1.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className={cn('gap-1.5 px-2.5', liked && 'text-rose-600 hover:text-rose-600')} onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
            <Heart className={cn('h-4 w-4', liked && 'fill-rose-600')} />
            <span className="text-xs tabular-nums">{post.likedBy.length}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 px-2.5" onClick={() => setShowComments(v => !v)}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs tabular-nums">{post.comments.length}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className={cn('gap-1.5 px-2.5', saved && 'text-emerald-600 hover:text-emerald-600')} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saved ? <BookmarkCheck className="h-4 w-4 fill-emerald-600" /> : <Bookmark className="h-4 w-4" />}
          <span className="hidden text-xs sm:inline">{saved ? 'Saved' : 'Save'}</span>
        </Button>
      </CardFooter>

      {showComments && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="space-y-3">
            {post.comments.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">No comments yet — start the conversation.</p>
            )}
            {post.comments.map(comment => {
              const cAuthor = commentAuthors[comment.authorId];
              return (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <UserAvatar user={cAuthor} size="sm" />
                  <div className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 shadow-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-semibold">
                        {cAuthor ? `${cAuthor.firstName} ${cAuthor.lastName}` : 'Member'}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed">{comment.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <UserAvatar user={user} size="sm" />
            <div className="flex flex-1 items-center gap-2 rounded-full border bg-background pl-3 pr-1">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) commentMutation.mutate(); }}
                placeholder="Write a comment…"
                className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={!commentText.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()} aria-label="Send comment">
                {commentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="h-4 w-4 text-destructive" /> Report this post</DialogTitle>
            <DialogDescription>Your report is anonymous to the author. Moderators will review it shortly.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={reportReason} onValueChange={setReportReason} className="gap-2">
            {REPORT_REASONS.map(r => (
              <label key={r.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value={r.value} />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="report-desc">Additional details (optional)</Label>
            <Textarea id="report-desc" value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={2} placeholder="Anything that helps moderators understand the issue…" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={reportMutation.isPending} onClick={() => reportMutation.mutate()}>
              {reportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={6} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button disabled={!editBody.trim() || editMutation.isPending} onClick={() => editMutation.mutate()}>
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The post and its comments will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>
              Delete post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ============================================================
// CreatePost composer
// ============================================================
export function CreatePostComposer({ groupId, placeholder }: { groupId?: string; placeholder?: string }) {
  const { user, t } = useApp();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => postsApi.create({ orgId: user!.orgId!, authorId: user!.id, body: body.trim(), imageUrls, groupId }),
    onSuccess: () => {
      setBody(''); setImageUrls([]); setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('Post published to the community.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addImage = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('Images must be under 2MB.'); return; }
    if (imageUrls.length >= 4) { toast.error('Maximum 4 images per post.'); return; }
    const url = await readFileAsDataUrl(file);
    setImageUrls(urls => [...urls, url]);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 space-y-3">
            {open ? (
              <>
                <Textarea
                  autoFocus value={body} onChange={e => setBody(e.target.value)} rows={3}
                  placeholder={placeholder ?? `Share an update, question or win with your ${t('community').toLowerCase()}…`}
                />
                {imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative">
                        { }
                        <img src={url} alt={`Attachment ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                        <button
                          onClick={() => setImageUrls(urls => urls.filter((_, j) => j !== i))}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) addImage(f); e.currentTarget.value = ''; }} />
                    <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 hover:bg-muted/50">
                      🖼️ Add image ({imageUrls.length}/4)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setBody(''); setImageUrls([]); }}>Cancel</Button>
                    <Button size="sm" disabled={!body.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="w-full rounded-full border bg-muted/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                {placeholder ?? `Share an update with your ${t('community').toLowerCase()}…`}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
