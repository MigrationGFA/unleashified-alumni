'use client';

// ============================================================
// Marketplace — alumni capabilities exchange (offers & needs)
// ============================================================
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Briefcase, GraduationCap, Loader2, MapPin, Search, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usersApi } from '@/lib/db/client';
import type { User } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';
import { cn } from '@/lib/format';

function MarketplaceCard({ member, terminology }: { member: User; terminology: { cohort: string } }) {
  const navigate = useAppStore(s => s.navigate);
  const p = member.profile;
  const hasMarket = p.companyName || p.elevatorPitch || p.offers.length > 0 || p.needs.length > 0;

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('profile', { id: member.id })} aria-label={`View ${member.firstName}'s profile`}>
          <UserAvatar user={member} size="lg" />
        </button>
        <div className="min-w-0 flex-1">
          <button className="text-left" onClick={() => navigate('profile', { id: member.id })}>
            <p className="truncate text-sm font-bold hover:underline">{member.firstName} {member.lastName}</p>
            <p className="truncate text-xs text-muted-foreground">{p.title ?? 'Member'}{p.sectors.length > 0 ? ` · ${p.sectors[0]}` : ''}</p>
          </button>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {p.location && (
              <Badge variant="outline" className="gap-1 text-[10px]"><MapPin className="h-2.5 w-2.5" /> {p.location}</Badge>
            )}
            {p.cohort && (
              <Badge variant="outline" className="gap-1 text-[10px]"><GraduationCap className="h-2.5 w-2.5" /> {p.cohort}</Badge>
            )}
          </div>
        </div>
      </div>

      {hasMarket && (
        <div className="mt-3 flex-1 space-y-2 border-t pt-3">
          {p.companyName && (
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              {p.companyName}{p.companyStage ? <span className="font-normal text-muted-foreground"> · {p.companyStage}</span> : null}
            </p>
          )}
          {p.elevatorPitch && <p className="line-clamp-2 text-xs text-muted-foreground">{p.elevatorPitch}</p>}
          {p.offers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.offers.map(o => <Badge key={o} className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300"><ArrowUpRight className="h-2.5 w-2.5" /> {o}</Badge>)}
            </div>
          )}
          {p.needs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.needs.slice(0, 2).map(n => <Badge key={n} variant="secondary" className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300"><ArrowDownLeft className="h-2.5 w-2.5" /> {n}</Badge>)}
              {p.needs.length > 2 && <Badge variant="secondary" className="text-[10px]">+{p.needs.length - 2}</Badge>}
            </div>
          )}
        </div>
      )}

      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => navigate('profile', { id: member.id })}>
        Contact {terminology.cohort === 'Batch' ? 'founder' : 'member'}
      </Button>
    </div>
  );
}

export function MarketplaceView() {
  const { user, org, t } = useApp();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [stage, setStage] = useState('all');
  const [tagFilter, setTagFilter] = useState<'all' | 'offers' | 'needs'>('all');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['directory', org?.id],
    queryFn: () => usersApi.searchDirectory(org!.id, user!.id),
    enabled: !!org && !!user?.id,
  });

  const sectors = useMemo(() => [...new Set(members.flatMap(m => m.profile.sectors))].sort(), [members]);
  const stages = useMemo(() => [...new Set(members.map(m => m.profile.companyStage).filter(Boolean) as string[])], [members]);

  const filtered = useMemo(() => {
    let list = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        (m.profile.title ?? '').toLowerCase().includes(q) ||
        (m.profile.companyName ?? '').toLowerCase().includes(q) ||
        m.profile.offers.some(o => o.toLowerCase().includes(q)) ||
        m.profile.needs.some(n => n.toLowerCase().includes(q)));
    }
    if (sector !== 'all') list = list.filter(m => m.profile.sectors.includes(sector));
    if (stage !== 'all') list = list.filter(m => m.profile.companyStage === stage);
    if (tagFilter === 'offers') list = list.filter(m => m.profile.offers.length > 0);
    if (tagFilter === 'needs') list = list.filter(m => m.profile.needs.length > 0);
    return list;
  }, [members, search, sector, stage, tagFilter]);

  const activeFilters = [search && 'search', sector !== 'all' && 'sector', stage !== 'all' && 'stage', tagFilter !== 'all' && 'tag'].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          {t('community') === 'Hub' ? 'Founders, companies and capabilities' : 'Alumni companies, expert profiles and services'} — match offers with needs.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, company, offer or need…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-full min-w-36 lg:w-40"><SelectValue placeholder="Sector" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-full min-w-36 lg:w-44"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={v => setTagFilter(v as typeof tagFilter)}>
            <SelectTrigger className="w-full min-w-32 lg:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="offers">Offering help</SelectItem>
              <SelectItem value="needs">Looking for help</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <button className="font-medium text-primary hover:underline" onClick={() => { setSearch(''); setSector('all'); setStage('all'); setTagFilter('all'); }}>
            Clear all filters
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No marketplace listings found" description="Try different filters — or update your own profile to appear in the marketplace." />
      ) : (
        <div className={cn('grid gap-4', 'sm:grid-cols-2 xl:grid-cols-3')}>
          {filtered.map(member => <MarketplaceCard key={member.id} member={member} terminology={{ cohort: t('cohort') }} />)}
        </div>
      )}
    </div>
  );
}
