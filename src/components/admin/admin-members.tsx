'use client';

// ============================================================
// Admin members — directory, CRUD, verification, bulk import
// (ported from stp-admin user-dir)
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2, Clock, Download, Eye, EyeOff, GraduationCap, Loader2, Lock, MoreHorizontal,
  Search, ShieldCheck, Unlock, Upload, UserCheck, UserPlus, UserX, Users, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usersApi } from '@/lib/db/client';
import type { Role, User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { UserAvatar } from '@/components/shared/user-avatar';
import { StatCard } from '@/components/shared/primitives';
import { ROLE_LABELS, formatDate, parseCsv } from '@/lib/format';

type StatusFilter = 'all' | 'verified' | 'pending' | 'onboarded' | 'locked';

function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => usersApi.create(org!.id, { firstName, lastName, email }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onOpenChange(false); setFirstName(''); setLastName(''); setEmail('');
      toast.success(`${created.firstName} provisioned — temp password: ${created.tempPassword}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provision a new {org?.terminology.member.toLowerCase() ?? 'member'}</DialogTitle>
          <DialogDescription>
            The member receives a temporary password and must complete onboarding + password change at first login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First name *</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last name *</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email address *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@organization.org" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!firstName.trim() || !lastName.trim() || !email.includes('@') || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Provision account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportMembersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');

  const parsed = useMemo(() => parseCsv(csvText), [csvText]);

  const mutation = useMutation({
    mutationFn: () => usersApi.bulkCreate(org!.id, parsed),
    onSuccess: ({ created, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onOpenChange(false); setCsvText('');
      toast.success(`${created} members imported${skipped ? `, ${skipped} skipped (duplicates/invalid)` : ''}.`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import roster</DialogTitle>
          <DialogDescription>
            Paste CSV rows in the format <code className="rounded bg-muted px-1 py-0.5 text-[11px]">First,Last,Email</code> — one member per line.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={csvText} onChange={e => setCsvText(e.target.value)} rows={7}
            placeholder={'Ada,Lovelace,ada@example.org\nKwame,Nkrumah,kwame@example.org'}
            className="font-mono text-xs"
          />
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{parsed.length} valid rows detected</span>
            <label className="cursor-pointer font-medium text-primary hover:underline">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={async e => {
                const file = e.target.files?.[0];
                if (file) setCsvText(await file.text());
              }} />
              Choose .csv file instead
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={parsed.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${parsed.length} members`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileDialog({ userId, open, onOpenChange }: { userId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { org } = useApp();
  const { data: u } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.get(userId!),
    enabled: !!userId,
  });
  const [showTemp, setShowTemp] = useState(false);

  if (!u) return null;
  const p = u.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar user={u} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="text-left">{u.firstName} {u.lastName}</DialogTitle>
              <DialogDescription className="text-left">{u.email}</DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
            {u.isVerified ? <Badge variant="secondary" className="gap-1 text-emerald-600"><ShieldCheck className="h-3 w-3" /> Verified</Badge> : <Badge variant="secondary" className="gap-1 text-amber-600"><Clock className="h-3 w-3" /> Pending</Badge>}
            {!u.isActive && <Badge variant="secondary" className="gap-1"><UserX className="h-3 w-3" /> Inactive</Badge>}
            {u.isLocked && <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>}
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs">
            <div><p className="text-muted-foreground">Member since</p><p className="mt-0.5 font-medium">{formatDate(u.createdAt)}</p></div>
            <div><p className="text-muted-foreground">Last login</p><p className="mt-0.5 font-medium">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</p></div>
            <div><p className="text-muted-foreground">{org?.terminology.cohort ?? 'Cohort'}</p><p className="mt-0.5 font-medium">{p.cohort ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Location</p><p className="mt-0.5 font-medium">{p.location ?? '—'}</p></div>
          </div>

          {p.title || p.companyName ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Professional</p>
              <div className="space-y-1 text-xs">
                {p.title && <p><span className="text-muted-foreground">Title:</span> <span className="font-medium">{p.title}</span></p>}
                {p.companyName && <p><span className="text-muted-foreground">Company:</span> <span className="font-medium">{p.companyName}</span>{p.companyStage ? ` · ${p.companyStage}` : ''}</p>}
                {p.businessModel && <p><span className="text-muted-foreground">Model:</span> {p.businessModel}</p>}
              </div>
            </div>
          ) : null}

          {(p.sectors.length > 0 || p.skills.length > 0) && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sectors & skills</p>
              <div className="flex flex-wrap gap-1">
                {p.sectors.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                {p.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
          )}

          {p.goals && (
            <div className="rounded-lg bg-muted/40 p-3 text-xs">
              <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Goals</p>
              <p className="leading-relaxed">{p.goals}</p>
            </div>
          )}

          {(p.offers.length > 0 || p.needs.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {p.offers.map(o => <Badge key={o} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">↑ {o}</Badge>)}
              {p.needs.map(n => <Badge key={n} variant="secondary">↓ {n}</Badge>)}
            </div>
          )}

          {u.tempPassword && (
            <div className="rounded-lg border p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temporary password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1.5 font-mono text-xs">{showTemp ? u.tempPassword : '••••••••'}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTemp(v => !v)} aria-label="Toggle temp password">
                  {showTemp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(u.tempPassword!); toast.success('Copied.'); }}>Copy</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminMembersView() {
  const { org } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [roleFor, setRoleFor] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<Role>('MEMBER');
  const [deleteFor, setDeleteFor] = useState<User | null>(null);
  const PER_PAGE = 8;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['org-users', org?.id],
    queryFn: () => usersApi.listByOrg(org!.id),
    enabled: !!org,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['org-users'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const actionMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'verify' | 'activate' | 'deactivate' | 'lock' | 'unlock' | 'delete' }) => {
      if (action === 'verify') {
        await usersApi.verify(userId);
        return true;
      }
      return usersApi.setStatus(userId, action);
    },
    onSuccess: (_d, { action }) => {
      invalidate();
      toast.success(`Member ${action}d successfully.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const roleMutation = useMutation({
    mutationFn: () => usersApi.changeRole(roleFor!.id, newRole),
    onSuccess: (u) => { invalidate(); setRoleFor(null); toast.success(`Role changed to ${ROLE_LABELS[u.role]}.`); },
  });

  const filtered = useMemo(() => {
    let list = users;
    if (statusFilter === 'verified') list = list.filter(u => u.isVerified);
    if (statusFilter === 'pending') list = list.filter(u => !u.isVerified);
    if (statusFilter === 'onboarded') list = list.filter(u => u.isOnboarded);
    if (statusFilter === 'locked') list = list.filter(u => u.isLocked);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }, [users, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const exportCsv = () => {
    const header = 'First Name,Last Name,Email Address,Status,Role\n';
    const rows = filtered.map(u => `${u.firstName},${u.lastName},${u.email},${u.isVerified ? 'Verified' : 'Pending'},${u.role}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_directory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} members to CSV.`);
  };

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    pending: users.filter(u => !u.isVerified).length,
    onboarded: users.filter(u => u.isOnboarded).length,
    locked: users.filter(u => u.isLocked).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{org?.terminology.member ?? 'Member'} Directory</h1>
          <p className="text-sm text-muted-foreground">Provision, verify and manage {org?.shortName ?? 'your'} members.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Bulk import</Button>
          <Button className="gap-1.5" onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4" /> Add member</Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total" value={stats.total} icon={Users} />
        <StatCard title="Verified" value={stats.verified} icon={ShieldCheck} iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" />
        <StatCard title="Pending review" value={stats.pending} icon={Clock} iconClassName="text-amber-600 bg-amber-50 dark:bg-amber-950/50" highlight={stats.pending > 0} />
        <StatCard title="Onboarded" value={stats.onboarded} icon={UserCheck} iconClassName="text-teal-600 bg-teal-50 dark:bg-teal-950/50" />
        <StatCard title="Locked" value={stats.locked} icon={Lock} iconClassName="text-rose-600 bg-rose-50 dark:bg-rose-950/50" />
        <StatCard title="Admins" value={stats.admins} icon={GraduationCap} iconClassName="text-violet-600 bg-violet-50 dark:bg-violet-950/50" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search by name or email…" className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as StatusFilter); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending approval</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-1.5" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden md:table-cell">{org?.terminology.cohort ?? 'Cohort'}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading members…</TableCell></TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No members match your filters.</TableCell></TableRow>
                ) : pageRows.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <button className="flex items-center gap-3 text-left" onClick={() => setProfileId(u.id)}>
                        <UserAvatar user={u} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium hover:underline">{u.firstName} {u.lastName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">{u.profile.cohort ?? '—'}</TableCell>
                    <TableCell>
                      {u.isLocked ? (
                        <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>
                      ) : u.isVerified ? (
                        <Badge variant="secondary" className="gap-1 text-emerald-600"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-amber-600"><Clock className="h-3 w-3" /> Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-xs lg:table-cell">{ROLE_LABELS[u.role]}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setProfileId(u.id)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View profile
                          </DropdownMenuItem>
                          {!u.isVerified && (
                            <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => actionMutation.mutate({ userId: u.id, action: 'verify' })}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Verify member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { setNewRole(u.role); setRoleFor(u); }}>
                            <Users className="mr-2 h-3.5 w-3.5" /> Change role…
                          </DropdownMenuItem>
                          {u.isLocked ? (
                            <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => actionMutation.mutate({ userId: u.id, action: 'unlock' })}>
                              <Unlock className="mr-2 h-3.5 w-3.5" /> Unlock account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-amber-600 focus:text-amber-600" onClick={() => actionMutation.mutate({ userId: u.id, action: 'lock' })}>
                              <Lock className="mr-2 h-3.5 w-3.5" /> Lock account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteFor(u)}>
                            <XCircle className="mr-2 h-3.5 w-3.5" /> Delete member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} members · page {page + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportMembersDialog open={importOpen} onOpenChange={setImportOpen} />
      <ProfileDialog userId={profileId} open={!!profileId} onOpenChange={v => !v && setProfileId(null)} />

      {/* Change role dialog */}
      <Dialog open={!!roleFor} onOpenChange={v => !v && setRoleFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change role — {roleFor?.firstName} {roleFor?.lastName}</DialogTitle>
            <DialogDescription>Organization admins manage members, content and branding.</DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={v => setNewRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleFor(null)}>Cancel</Button>
            <Button disabled={roleMutation.isPending || newRole === roleFor?.role} onClick={() => roleMutation.mutate()}>
              {roleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteFor} onOpenChange={v => !v && setDeleteFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleteFor?.firstName} {deleteFor?.lastName}?</DialogTitle>
            <DialogDescription>The account and all their posts will be permanently removed. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { actionMutation.mutate({ userId: deleteFor!.id, action: 'delete' }); setDeleteFor(null); }}>
              Delete member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-0" style={{ pointerEvents: 'none', display: 'none' }} aria-hidden />
    </div>
  );
}
