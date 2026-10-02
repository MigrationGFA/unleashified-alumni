'use client';

// ============================================================
// View router — maps hash-route views to components with
// role-based access control
// ============================================================
import type { Role } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';

// Member portal
import { DashboardHome } from '@/components/member/dashboard-home';
import { NewsfeedView } from '@/components/member/newsfeed-view';
import { NetworkView } from '@/components/member/network-view';
import { MarketplaceView } from '@/components/member/marketplace-view';
import { EventsView } from '@/components/member/events-view';
import { GroupsView, GroupDetailView } from '@/components/member/groups-view';
import { DealRoomsView } from '@/components/member/deal-room-view';
import { MessagingView } from '@/components/member/messaging-view';
import { ResourcesView } from '@/components/member/resources-view';
import { ProfileView } from '@/components/member/profile-view';
import { SettingsView } from '@/components/member/settings-view';
import { SupportView } from '@/components/member/support-view';

// Admin backoffice
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminMembersView } from '@/components/admin/admin-members';
import { AdminContentView } from '@/components/admin/admin-content';
import { AdminGroupsView } from '@/components/admin/admin-groups';
import { AdminDealRoomsView, AdminSupportView } from '@/components/admin/admin-dealrooms-support';
import { OrgSettingsView } from '@/components/admin/org-settings';

// Super admin
import { PlatformDashboard, PlatformOrgsView, OrgDetailView } from '@/components/superadmin/platform-views';
import { PlatformAnalyticsView, PlatformSecurityView, PlatformSettingsView } from '@/components/superadmin/platform-more-views';

const MEMBER_VIEWS = new Set([
  'dashboard', 'newsfeed', 'network', 'messaging', 'marketplace', 'events', 'event',
  'groups', 'group', 'deal-room', 'resources', 'profile', 'settings', 'support',
]);

const ADMIN_VIEWS = new Set([
  'admin-dashboard', 'admin-members', 'admin-content', 'admin-groups',
  'admin-dealrooms', 'admin-support', 'org-settings',
]);

const SUPERADMIN_VIEWS = new Set([
  'platform-dashboard', 'platform-orgs', 'org', 'platform-analytics',
  'platform-security', 'platform-settings',
]);

const DEFAULT_VIEW: Record<Role, string> = {
  SUPERADMIN: 'platform-dashboard',
  ADMIN: 'admin-dashboard',
  MEMBER: 'dashboard',
};

export function ViewRouter() {
  const { view, params, navigate } = useAppStore();
  const { user, isAdmin, isSuperAdmin } = useApp();

  const role = user?.role ?? 'MEMBER';

  // Access control
  const allowed =
    MEMBER_VIEWS.has(view) ||
    (isAdmin && ADMIN_VIEWS.has(view)) ||
    (isSuperAdmin && SUPERADMIN_VIEWS.has(view));

  // Admins and superadmins can access member views too (they are community participants);
  // members can never access admin/superadmin views.
  const finalView = allowed ? view : DEFAULT_VIEW[role];
  if (!allowed) {
    // redirect once
    navigate(DEFAULT_VIEW[role]);
  }

  switch (finalView) {
    // ---- Member portal ----
    case 'dashboard':
      return role === 'MEMBER' ? <DashboardHome /> : <MemberBridgeHome />;
    case 'newsfeed':
      return <NewsfeedView />;
    case 'network':
      return <NetworkView />;
    case 'messaging':
      return <MessagingView peerId={params?.id} />;
    case 'marketplace':
      return <MarketplaceView />;
    case 'events':
      return <EventsView />;
    case 'event':
      return <EventDetailViewWrapped eventId={params?.id} />;
    case 'groups':
      return <GroupsView />;
    case 'group':
      return params?.id ? <GroupDetailView groupId={params.id} /> : <GroupsView />;
    case 'deal-room':
      return <DealRoomsView roomId={params?.id} />;
    case 'resources':
      return <ResourcesView />;
    case 'profile':
      return params?.id ? <ProfileView userId={params.id} /> : <ProfileView userId={user?.id ?? ''} />;
    case 'settings':
      return <SettingsView />;
    case 'support':
      return <SupportView />;

    // ---- Admin backoffice ----
    case 'admin-dashboard':
      return <AdminDashboard />;
    case 'admin-members':
      return <AdminMembersView />;
    case 'admin-content':
      return <AdminContentView />;
    case 'admin-groups':
      return <AdminGroupsView />;
    case 'admin-dealrooms':
      return <AdminDealRoomsView />;
    case 'admin-support':
      return <AdminSupportView />;
    case 'org-settings':
      return <OrgSettingsView />;

    // ---- Super admin ----
    case 'platform-dashboard':
      return <PlatformDashboard />;
    case 'platform-orgs':
      return <PlatformOrgsView />;
    case 'org':
      return params?.id ? <OrgDetailView orgId={params.id} /> : <PlatformOrgsView />;
    case 'platform-analytics':
      return <PlatformAnalyticsView />;
    case 'platform-security':
      return <PlatformSecurityView />;
    case 'platform-settings':
      return <PlatformSettingsView />;

    default:
      return role === 'MEMBER' ? <DashboardHome /> : <MemberBridgeHome />;
  }
}

function EventDetailViewWrapped({ eventId }: { eventId?: string }) {
  // Events browse view with the deep-linked event auto-opened
  return (
    <div>
      <EventsView initialEventId={eventId} />
    </div>
  );
}

// Admin/superadmin landing when hitting member dashboard
function MemberBridgeHome() {
  const { user, org } = useApp();
  const navigate = useAppStore(s => s.navigate);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in as {user?.role === 'SUPERADMIN' ? 'a platform Super Admin' : `an administrator${org ? ` of ${org.shortName}` : ''}`}.
          Head to your console, or explore the community experience your members see.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate(user?.role === 'SUPERADMIN' ? 'platform-dashboard' : 'admin-dashboard')}>
            Open my console
          </Button>
          <Button variant="outline" onClick={() => navigate('newsfeed')}>Explore community feed</Button>
        </div>
      </div>
    </div>
  );
}
