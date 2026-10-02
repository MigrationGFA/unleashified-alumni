// ============================================================
// Unleashified Alumni Platform — Mock JSON-DB Type System
// Merged data model from stp-admin + stp-alumni + multi-tenant orgs
// ============================================================

export type Role = 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
export type OrgType = 'UNIVERSITY' | 'CORPORATE' | 'ASSOCIATION' | 'COMMUNITY' | 'ACCELERATOR';
export type OrgStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface OrgTerminology {
  cohort: string;      // "Cohort" | "Class Year" | "Batch"
  node: string;        // "Node" | "Chapter" | "City Chapter"
  member: string;      // "Alumni" | "Member" | "Founder"
  community: string;   // "Network" | "Association" | "Hub"
}

export interface OrgColors {
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  sidebar: string;
}

export interface OrgLogoStyle {
  initials: string;
  bg: string;
  fg: string;
}

export interface OrgSettings {
  strictVerification: boolean;
  opportunityModeration: boolean;
  allowGuestView: boolean;
  emailNotificationsDefault: boolean;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  type: OrgType;
  description: string;
  mission: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  foundedYear: number;
  colors: OrgColors;
  logoStyle: OrgLogoStyle;
  logoDataUrl?: string | null;
  terminology: OrgTerminology;
  settings: OrgSettings;
  socialLinks: { linkedin?: string; twitter?: string; instagram?: string; facebook?: string };
  status: OrgStatus;
  createdAt: string;
}

export type ContactVisibility = 'EVERYONE' | 'CONNECTIONS_ONLY' | 'ADMIN_ONLY';

export interface UserProfile {
  title?: string;
  cohort?: string;
  node?: string;
  location?: string;
  sectors: string[];
  skills: string[];
  goals?: string;
  linkedInProfile?: string;
  avatarUrl?: string | null;
  companyName?: string;
  businessModel?: string;
  companyStage?: string;
  elevatorPitch?: string;
  offers: string[];
  needs: string[];
  contactVisibility: ContactVisibility;
  companyWebsite?: string;
}

export interface User {
  id: string;
  orgId: string | null; // null => platform-level (superadmin)
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tempPassword?: string;
  role: Role;
  isOnboarded: boolean;
  passwordChangeRequired: boolean;
  isActive: boolean;
  isLocked: boolean;
  isVerified: boolean;
  isDeactivated: boolean;
  lastLogin: string | null;
  createdAt: string;
  language: 'en' | 'fr' | 'ar';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  profile: UserProfile;
}

export type PostStatus = 'ACTIVE' | 'HIDDEN' | 'REPORTED' | 'PENDING';

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface PostReport {
  id: string;
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'OTHER';
  description?: string;
  reportedBy: string; // userId
  createdAt: string;
}

export interface Post {
  id: string;
  orgId: string;
  groupId?: string | null;
  authorId: string;
  body: string;
  title?: string;
  postType: 'SOCIAL' | 'OFFICIAL';
  category?: string;
  imageUrls: string[];
  videoUrl?: string | null;
  likedBy: string[];
  comments: Comment[];
  savedBy: string[];
  createdAt: string;
  status: PostStatus;
  reports: PostReport[];
}

export interface OfficialNews {
  id: string;
  orgId: string;
  title: string;
  content: string;
  category: string;
  coverImage?: string | null;
  publishedAt: string;
  views: number;
  authorId: string;
  status: 'draft' | 'published';
}

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'IGNORED' | 'DECLINED';

export interface Connection {
  id: string;
  orgId: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  createdAt: string;
  connectedSince?: string;
}

export type GroupStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'LOCKED' | 'REJECTED';
export type GroupPrivacy = 'PUBLIC' | 'CLOSED';

export interface GroupJoinRequest {
  id: string;
  userId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  orgId: string;
  name: string;
  description: string;
  privacyMode: GroupPrivacy;
  status: GroupStatus;
  members: { userId: string; memberRole: 'ADMIN' | 'MEMBER'; joinedAt: string }[];
  coverImage?: string | null;
  createdBy: string;
  createdAt: string;
  joinRequests: GroupJoinRequest[];
  inviteToken?: string;
  likedBy: string[];
  reportReason?: string | null;
  reportedBy?: string | null;
}

export type EventStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
export type EventType = 'online' | 'in-person' | 'hybrid';

export interface AppEvent {
  id: string;
  orgId: string;
  name: string;
  description: string;
  type: EventType;
  timeZone: string;
  startTime: string;
  endTime: string;
  externalLink?: string;
  address?: string;
  venue?: string;
  coverImage?: string | null;
  createdBy: string;
  attendeeIds: string[];
  waitlistIds: string[];
  capacity: number;
  status: EventStatus;
  visibility: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'VERIFIED_ONLY' | 'INVITATION_ONLY';
  createdAt: string;
}

export type ConversationType = 'DIRECT' | 'GROUP';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaType?: 'image' | 'video' | 'document' | null;
  mediaUrl?: string | null;
  createdAt: string;
  status: 'sending' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: string;
  orgId: string;
  type: ConversationType;
  name?: string;
  participantIds: string[];
  messages: Message[];
  createdBy: string;
  createdAt: string;
  readBy: Record<string, string>; // userId -> lastReadMessageId
}

export interface DealRoomMember {
  userId: string;
  ndaSigned: boolean;
  ndaSignedAt?: string | null;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface DealRoomFile {
  id: string;
  name: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface DealRoomMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface DealRoomAuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  reason?: string;
}

export interface DealRoom {
  id: string;
  orgId: string;
  roomName: string;
  roomDescription: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  status: 'ACTIVE' | 'PENDING_APPROVAL';
  members: DealRoomMember[];
  messages: DealRoomMessage[];
  files: DealRoomFile[];
  auditLog: DealRoomAuditEntry[];
}

export type ResourceCategory = 'guides' | 'trainingMaterials' | 'templates' | 'policies' | 'sharedDocs' | 'videos';

export interface Resource {
  id: string;
  orgId: string;
  title: string;
  description: string;
  category: ResourceCategory;
  isVideo: boolean;
  fileType: string;
  downloads: number;
  uploadedBy: string;
  visibility: 'ALL' | 'VERIFIED';
  status: 'ACTIVE' | 'PENDING' | 'ARCHIVED';
  createdAt: string;
}

export type NotificationType =
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'EVENT_REGISTRATION'
  | 'EVENT_UPDATE'
  | 'NEW_MESSAGE'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'SUPPORT_RESPONSE';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export type SupportStatus = 'UNREAD' | 'READ' | 'RESOLVED';

export interface SupportTicket {
  id: string;
  orgId: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportStatus;
  createdAt: string;
  reviewedAt?: string | null;
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DELETED'
  | 'ROLE_CHANGED';

export interface SecurityLog {
  id: string;
  eventType: SecurityEventType;
  email: string;
  ipAddress: string;
  orgId?: string | null;
  createdAt: string;
}

// ---------- Analytics shapes ----------
export interface DashboardSummary {
  totalUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  activeUsers: number;
  pendingGroups: number;
  totalGroups: number;
  pendingEvents: number;
  totalEvents: number;
  connections: number;
  totalPosts: number;
  reportedPosts: number;
  hiddenPosts: number;
  supportOpen: number;
  dealRooms: number;
  pendingDealRooms: number;
}

export interface CountryDistribution { country: string; count: number; }
export interface SectorDistribution { sector: string; count: number; }
export interface CohortDistribution { cohort: string; count: number; }
export interface EngagementLeader { userId: string; name: string; activityScore: number; }

export interface OrgAnalytics {
  totalMembers: number;
  onboardedMembers: number;
  totalGroups: number;
  totalDealRooms: number;
  totalPosts: number;
  totalEvents: number;
  totalCountries: number;
  byCountry: CountryDistribution[];
  bySector: SectorDistribution[];
  byCohort: CohortDistribution[];
  byMonth: { month: string; members: number; posts: number; events: number }[];
  leaderboard: EngagementLeader[];
}

export interface PlatformSummary {
  totalOrganizations: number;
  totalMembers: number;
  totalAdmins: number;
  totalPosts: number;
  totalEvents: number;
  totalConnections: number;
  pendingOrgs: number;
  activeOrgs: number;
}

export interface Database {
  organizations: Organization[];
  users: User[];
  posts: Post[];
  news: OfficialNews[];
  connections: Connection[];
  groups: Group[];
  events: AppEvent[];
  conversations: Conversation[];
  dealRooms: DealRoom[];
  resources: Resource[];
  notifications: AppNotification[];
  supportTickets: SupportTicket[];
  securityLogs: SecurityLog[];
}
