'use client';

// ============================================================
// Role-aware navigation definitions.
// `label` is the English fallback; `labelKey` / `titleKey` point
// at the i18n "Nav" namespace so the sidebar and mobile nav
// render in the active locale (en / fr / ar).
// ============================================================
import {
  BookOpen, Briefcase, Building2, Calendar, HelpCircle, Home, Inbox, LayoutDashboard,
  Megaphone, MessageSquare, Newspaper, Settings, ShieldAlert, ShieldCheck, ShoppingBag,
  TrendingUp, Users, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/db/types';

export interface NavItem {
  view: string;
  label: string; // English fallback (used if i18n key is missing)
  labelKey: string; // i18n key, e.g. 'Nav.items.dashboard'
  icon: LucideIcon;
  dynamic?: boolean; // takes an :id param
}

export interface NavSection {
  title: string; // English fallback
  titleKey: string; // i18n key, e.g. 'Nav.sections.community'
  items: NavItem[];
}

const MEMBER_SECTIONS: NavSection[] = [
  {
    title: 'Community',
    titleKey: 'Nav.sections.community',
    items: [
      { view: 'dashboard', label: 'Dashboard', labelKey: 'Nav.items.dashboard', icon: Home },
      { view: 'newsfeed', label: 'Newsfeed', labelKey: 'Nav.items.newsfeed', icon: Newspaper },
      { view: 'network', label: 'Network', labelKey: 'Nav.items.network', icon: Users },
      { view: 'messaging', label: 'Messaging', labelKey: 'Nav.items.messaging', icon: MessageSquare },
      { view: 'marketplace', label: 'Marketplace', labelKey: 'Nav.items.marketplace', icon: ShoppingBag },
      { view: 'events', label: 'Events', labelKey: 'Nav.items.events', icon: Calendar },
      { view: 'groups', label: 'Groups', labelKey: 'Nav.items.groups', icon: UsersRound },
      { view: 'deal-room', label: 'Deal Room', labelKey: 'Nav.items.dealRoom', icon: Briefcase },
      { view: 'resources', label: 'Resources', labelKey: 'Nav.items.resources', icon: BookOpen },
    ],
  },
  {
    title: 'Support',
    titleKey: 'Nav.sections.support',
    items: [
      { view: 'support', label: 'Help & Support', labelKey: 'Nav.items.helpSupport', icon: HelpCircle },
      { view: 'settings', label: 'Settings', labelKey: 'Nav.items.settings', icon: Settings },
    ],
  },
];

const ADMIN_SECTIONS: NavSection[] = [
  {
    title: 'Administration',
    titleKey: 'Nav.sections.administration',
    items: [
      { view: 'admin-dashboard', label: 'Overview', labelKey: 'Nav.items.overview', icon: LayoutDashboard },
      { view: 'admin-members', label: 'Members', labelKey: 'Nav.items.members', icon: Users },
      { view: 'admin-content', label: 'Content & Engagement', labelKey: 'Nav.items.contentEngagement', icon: Megaphone },
      { view: 'admin-groups', label: 'Groups', labelKey: 'Nav.items.groups', icon: ShieldCheck },
      { view: 'admin-dealrooms', label: 'Deal Rooms', labelKey: 'Nav.items.dealRooms', icon: Briefcase },
      { view: 'admin-support', label: 'Support Inbox', labelKey: 'Nav.items.supportInbox', icon: Inbox },
      { view: 'org-settings', label: 'Organization Settings', labelKey: 'Nav.items.orgSettings', icon: Building2 },
    ],
  },
  {
    title: 'Community',
    titleKey: 'Nav.sections.community',
    items: [
      { view: 'newsfeed', label: 'Newsfeed', labelKey: 'Nav.items.newsfeed', icon: Newspaper },
      { view: 'events', label: 'Events', labelKey: 'Nav.items.events', icon: Calendar },
      { view: 'marketplace', label: 'Marketplace', labelKey: 'Nav.items.marketplace', icon: ShoppingBag },
      { view: 'network', label: 'Network', labelKey: 'Nav.items.network', icon: Users },
    ],
  },
];

const SUPERADMIN_SECTIONS: NavSection[] = [
  {
    title: 'Platform',
    titleKey: 'Nav.sections.platform',
    items: [
      { view: 'platform-dashboard', label: 'Overview', labelKey: 'Nav.items.overview', icon: LayoutDashboard },
      { view: 'platform-orgs', label: 'Organizations', labelKey: 'Nav.items.organizations', icon: Building2 },
      { view: 'platform-analytics', label: 'Analytics', labelKey: 'Nav.items.analytics', icon: TrendingUp },
      { view: 'platform-security', label: 'Security Logs', labelKey: 'Nav.items.securityLogs', icon: ShieldAlert },
      { view: 'platform-settings', label: 'Platform Settings', labelKey: 'Nav.items.platformSettings', icon: Settings },
    ],
  },
];

export function navSectionsForRole(role: Role | undefined): NavSection[] {
  if (role === 'SUPERADMIN') return SUPERADMIN_SECTIONS;
  if (role === 'ADMIN') return ADMIN_SECTIONS;
  return MEMBER_SECTIONS;
}

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: 'Home', labelKey: 'Nav.mobile.home', icon: Home },
  { view: 'newsfeed', label: 'Feed', labelKey: 'Nav.mobile.feed', icon: Newspaper },
  { view: 'network', label: 'Network', labelKey: 'Nav.mobile.network', icon: Users },
  { view: 'messaging', label: 'Chats', labelKey: 'Nav.mobile.chats', icon: MessageSquare },
  { view: 'events', label: 'Events', labelKey: 'Nav.mobile.events', icon: Calendar },
  { view: 'marketplace', label: 'Market', labelKey: 'Nav.mobile.market', icon: ShoppingBag },
];

export const ADMIN_MOBILE_NAV_ITEMS: NavItem[] = [
  { view: 'admin-dashboard', label: 'Overview', labelKey: 'Nav.mobile.overview', icon: LayoutDashboard },
  { view: 'admin-members', label: 'Members', labelKey: 'Nav.mobile.members', icon: Users },
  { view: 'admin-content', label: 'Content', labelKey: 'Nav.mobile.content', icon: Megaphone },
  { view: 'admin-support', label: 'Support', labelKey: 'Nav.mobile.support', icon: Inbox },
  { view: 'org-settings', label: 'Org', labelKey: 'Nav.mobile.org', icon: Building2 },
];

export const SUPERADMIN_MOBILE_NAV_ITEMS: NavItem[] = [
  { view: 'platform-dashboard', label: 'Overview', labelKey: 'Nav.mobile.overview', icon: LayoutDashboard },
  { view: 'platform-orgs', label: 'Orgs', labelKey: 'Nav.mobile.orgs', icon: Building2 },
  { view: 'platform-analytics', label: 'Analytics', labelKey: 'Nav.mobile.analytics', icon: TrendingUp },
  { view: 'platform-security', label: 'Security', labelKey: 'Nav.mobile.security', icon: ShieldAlert },
  { view: 'platform-settings', label: 'Settings', labelKey: 'Nav.mobile.settings', icon: Settings },
];

export function mobileNavForRole(role: Role | undefined): NavItem[] {
  if (role === 'SUPERADMIN') return SUPERADMIN_MOBILE_NAV_ITEMS;
  if (role === 'ADMIN') return ADMIN_MOBILE_NAV_ITEMS;
  return MOBILE_NAV_ITEMS;
}
