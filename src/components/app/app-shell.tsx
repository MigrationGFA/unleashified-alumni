'use client';

// ============================================================
// App shell — role-aware sidebar, header, mobile bottom nav
// Org branding is applied as CSS variables on this wrapper.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronsLeft, ChevronsRight, FileText, LogOut, Newspaper, Calendar, PanelLeft, Search, Settings, User as UserIcon, UsersRound, HelpCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationsApi, searchApi } from '@/lib/db/client';
import { useAppStore } from '@/stores/useAppStore';
import { useApp } from '@/components/app/app-context';
import { navSectionsForRole, mobileNavForRole, type NavItem } from '@/lib/nav';
import { OrgLogo } from '@/components/shared/org-logo';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { ROLE_LABELS, cn, timeAgo } from '@/lib/format';

// Translated role label (falls back to the English ROLE_LABELS entry)
function useRoleLabel(role: string | undefined): string {
  const { t } = useTranslation();
  const key = (role ?? 'MEMBER') as keyof typeof ROLE_LABELS;
  return t(`Nav.roles.${(role ?? 'MEMBER').toLowerCase()}`, { defaultValue: ROLE_LABELS[key] ?? 'Member' });
}

// ---------------- Sidebar ----------------
function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { view, navigate } = useAppStore();
  const { user, org } = useApp();
  const { t } = useTranslation();
  const sections = navSectionsForRole(user?.role);
  const roleLabel = useRoleLabel(user?.role);

  const isActive = (item: NavItem) =>
    view === item.view || (item.dynamic && view.startsWith(item.view));

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--org-sidebar)' }}>
      <div className={cn('flex items-center gap-3 border-b border-white/10 px-4 py-4', collapsed && 'justify-center px-2')}>
        <OrgLogo org={org} size="md" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-white">
              {user?.role === 'SUPERADMIN' ? t('Nav.sidebar.platformBrand') : org?.shortName ?? t('Nav.sidebar.communityFallback')}
            </p>
            <p className="truncate text-[11px] text-white/50">
              {user?.role === 'SUPERADMIN' ? t('Nav.sidebar.superAdminConsole') : roleLabel}
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-3 scroll-dark">
        <nav className="space-y-5">
          {sections.map(section => (
            <div key={section.title}>
              <p className={cn('mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40', collapsed && 'px-2 text-center')}>
                {t(section.titleKey, { defaultValue: section.title })}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(item => (
                  <li key={item.view}>
                    <button
                      onClick={() => { navigate(item.view); onNavigate?.(); }}
                      title={collapsed ? t(item.labelKey, { defaultValue: item.label }) : undefined}
                      aria-current={isActive(item) ? 'page' : undefined}
                      aria-label={t(item.labelKey, { defaultValue: item.label })}
                      className={cn(
                        'group flex w-full items-center rounded-lg text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                        isActive(item)
                          ? 'bg-white/12 text-white shadow-sm'
                          : 'text-white/65 hover:bg-white/8 hover:text-white'
                      )}
                      style={isActive(item) ? { boxShadow: 'inset 3px 0 0 0 var(--org-highlight)' } : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" style={isActive(item) ? { color: 'var(--org-highlight)' } : undefined} />
                      {!collapsed && <span className="truncate">{t(item.labelKey, { defaultValue: item.label })}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => { useAppStore.getState().setSession(null); toast.success(t('Nav.menu.signedOut')); }}
          title={t('Nav.sidebar.signOut')}
          aria-label={t('Nav.sidebar.signOut')}
          className={cn(
            'flex w-full items-center rounded-lg text-sm font-medium text-white/60 transition-colors hover:bg-white/8 hover:text-white',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && t('Nav.sidebar.signOut')}
        </button>
      </div>
    </div>
  );
}

// ---------------- Notifications ----------------
function NotificationBell() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.list(user!.id),
    enabled: !!user,
    refetchInterval: 20_000,
  });
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-org-accent px-1 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1 py-1.5">
          <p className="text-sm font-semibold">Notifications</p>
          <button
            className="text-[11px] font-medium text-primary hover:underline"
            onClick={async () => { await notificationsApi.markAllRead(user!.id); queryClient.invalidateQueries({ queryKey: ['notifications'] }); }}
          >
            Mark all read
          </button>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.slice(0, 12).map(n => (
                <button
                  key={n.id}
                  onClick={async () => {
                    if (!n.isRead) { await notificationsApi.markRead(n.id); queryClient.invalidateQueries({ queryKey: ['notifications'] }); }
                  }}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/60',
                    !n.isRead && 'bg-primary/5'
                  )}
                >
                  <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-org-accent')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{n.title}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------- Header ----------------
function AppHeader() {
  const { user, org } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const { t } = useTranslation();
  const roleLabel = useRoleLabel(user?.role);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md sm:px-5">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-0 bg-transparent p-0 [&>button]:text-white">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarNav onNavigate={() => document.dispatchEvent(new Event('press-close-mobile-nav'))} />
        </SheetContent>
      </Sheet>

      <div className="hidden min-w-0 items-center gap-2 md:flex lg:hidden">
        <OrgLogo org={org} size="sm" />
        <p className="truncate text-sm font-semibold">{user?.role === 'SUPERADMIN' ? 'Unleashified' : org?.shortName}</p>
      </div>

      <button
        onClick={() => setSearchOpen(true)}
        className="ml-auto flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:ml-0 md:w-72 lg:w-80"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden truncate md:inline">Search members, posts, events…</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-mono text-[10px] md:inline">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1 md:ml-auto">
        <LanguageSwitcher />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted/60" aria-label="Account menu">
              <UserAvatar user={user} size="sm" />
              <span className="hidden text-left lg:block">
                <span className="block max-w-36 truncate text-xs font-semibold leading-tight">{user ? `${user.firstName} ${user.lastName}` : ''}</span>
                <span className="block max-w-36 truncate text-[10px] text-muted-foreground">{roleLabel}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{user ? `${user.firstName} ${user.lastName}` : ''}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1.5">{roleLabel}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('profile', { id: user?.id })}>
              <UserIcon className="mr-2 h-4 w-4" /> {t('Nav.menu.viewProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('settings')}>
              <Settings className="mr-2 h-4 w-4" /> {t('Nav.items.settings')}
            </DropdownMenuItem>
            {user?.role !== 'SUPERADMIN' && (
              <DropdownMenuItem onClick={() => navigate('support')}>
                <HelpCircle className="mr-2 h-4 w-4" /> {t('Nav.items.helpSupport')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { useAppStore.getState().setSession(null); toast.success(t('Nav.menu.signedOut')); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> {t('Nav.sidebar.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global search dialog */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl rounded-xl border bg-card shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search members, posts, events, groups…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
              />
              <kbd className="rounded border px-1.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <GlobalSearchResults query={query} onDone={() => setSearchOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

function GlobalSearchResults({ query, onDone }: { query: string; onDone: () => void }) {
  const { user } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const { data, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchApi.search(user!.orgId!, user!.id, query),
    enabled: !!user && query.trim().length > 1,
  });

  if (query.trim().length <= 1) {
    return <p className="px-4 py-8 text-center text-xs text-muted-foreground">Type at least 2 characters to search.</p>;
  }
  if (isLoading) return <p className="px-4 py-8 text-center text-xs text-muted-foreground">Searching…</p>;
  if (!data || data.counts.people + data.counts.posts + data.counts.events + data.counts.groups + data.counts.news === 0) {
    return <p className="px-4 py-8 text-center text-xs text-muted-foreground">No results for “{query}”.</p>;
  }

  const go = (view: string, id?: string) => { onDone(); navigate(view, id ? { id } : undefined); };
  const sections: { title: string; icon: typeof UserIcon; count: number; rows: { id: string; label: string; sub?: string; view: string }[] }[] = [
    {
      title: 'Members', icon: UserIcon, count: data.counts.people,
      rows: data.people.map((p: { id: string; firstName: string; lastName: string; profile?: { title?: string } }) => ({ id: p.id, label: `${p.firstName} ${p.lastName}`, sub: p.profile?.title, view: 'profile' })),
    },
    {
      title: 'Posts', icon: Newspaper, count: data.counts.posts,
      rows: data.posts.map((p: { id: string; body: string; authorId: string }) => ({ id: p.id, label: p.body.slice(0, 70) + (p.body.length > 70 ? '…' : ''), view: 'newsfeed' })),
    },
    {
      title: 'Events', icon: Calendar, count: data.counts.events,
      rows: data.events.map((e: { id: string; name: string; startTime: string }) => ({ id: e.id, label: e.name, sub: new Date(e.startTime).toLocaleDateString(), view: 'event' })),
    },
    {
      title: 'Groups', icon: UsersRound, count: data.counts.groups,
      rows: data.groups.map((g: { id: string; name: string; members?: { userId: string }[] }) => ({ id: g.id, label: g.name, sub: `${g.members?.length ?? 0} members`, view: 'group' })),
    },
    {
      title: 'Official news', icon: FileText, count: data.counts.news,
      rows: data.news.map((n: { id: string; title: string }) => ({ id: n.id, label: n.title, view: 'newsfeed' })),
    },
  ];

  return (
    <ScrollArea className="max-h-[50vh] p-2">
      {sections.filter(s => s.count > 0).map(section => (
        <div key={section.title} className="mb-1">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title} ({section.count})
          </p>
          {section.rows.slice(0, 4).map(row => (
            <button
              key={row.id}
              onClick={() => go(row.view, row.view === 'newsfeed' ? undefined : row.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60"
            >
              <section.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{row.label}</span>
                {row.sub && <span className="block truncate text-[11px] text-muted-foreground">{row.sub}</span>}
              </span>
            </button>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
}

// ---------------- Mobile bottom nav ----------------
function MobileBottomNav() {
  const { view, navigate } = useAppStore();
  const { user } = useApp();
  const { t } = useTranslation();
  const items = mobileNavForRole(user?.role);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md md:hidden" aria-label="Mobile navigation">
      <div ref={scrollRef} className="flex overflow-x-auto custom-scrollbar">
        {items.map(item => (
          <button
            key={item.view}
            onClick={() => navigate(item.view)}
            aria-current={view === item.view ? 'page' : undefined}
            className={cn(
              'flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[10px] font-medium transition-colors',
              view === item.view ? 'text-org-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{t(item.labelKey, { defaultValue: item.label })}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ---------------- Shell ----------------
export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { org } = useApp();

  // Apply org branding as CSS variables
  const style = org
    ? ({
        '--org-primary': org.colors.primary,
        '--org-secondary': org.colors.secondary,
        '--org-accent': org.colors.accent,
        '--org-highlight': org.colors.highlight,
        '--org-sidebar': org.colors.sidebar,
      } as React.CSSProperties)
    : {
        '--org-primary': '#1B2F5B',
        '--org-secondary': '#233389',
        '--org-accent': '#ED202D',
        '--org-highlight': '#FBAD17',
        '--org-sidebar': '#14224A',
      } as React.CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 md:block',
            sidebarCollapsed ? 'w-[68px]' : 'w-64'
          )}
        >
          <SidebarNav collapsed={sidebarCollapsed} />
        </aside>

        {/* Collapse handle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="sticky top-[60px] z-20 hidden h-10 w-4 items-center justify-center rounded-r-md border border-l-0 bg-background text-muted-foreground opacity-60 transition-all hover:opacity-100 md:flex"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="min-h-0 flex-1 pb-20 pt-4 md:pb-6">{children}</main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
