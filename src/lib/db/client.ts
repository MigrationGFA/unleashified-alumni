// ============================================================
// Mock JSON-DB client — in-memory database persisted to
// localStorage, exposed as an async service API with simulated
// latency (swap with real REST later without touching the UI).
// ============================================================
import { seedDatabase, svgImage, DEMO_PASSWORD } from './seed';
import type {
  AppNotification, AppEvent, Connection, Conversation, Database, DealRoom, DealRoomFile, DealRoomMessage,
  Group, Message, OfficialNews, Organization, Post, Resource, Role, SecurityLog, SupportTicket, User,
  OrgAnalytics, PlatformSummary, DashboardSummary, OrgType,
} from './types';

const DB_KEY = 'unleashified_db_v2';
const LATENCY = [120, 420] as const;

let memoryDb: Database | null = null;
const isBrowser = typeof window !== 'undefined';

function db(): Database {
  if (memoryDb) return memoryDb;
  if (isBrowser) {
    try {
      const raw = window.localStorage.getItem(DB_KEY);
      if (raw) {
        memoryDb = JSON.parse(raw) as Database;
        return memoryDb;
      }
    } catch { /* corrupted storage -> reseed */ }
  }
  memoryDb = seedDatabase();
  persist();
  return memoryDb;
}

function persist() {
  if (!isBrowser || !memoryDb) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(memoryDb));
  } catch { /* storage full — keep working in memory */ }
}

export function resetDatabase() {
  memoryDb = seedDatabase();
  if (isBrowser) window.localStorage.removeItem(DB_KEY);
  persist();
}

const delay = () => new Promise<void>(res => setTimeout(res, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])));
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// ============================================================
// AUTH
// ============================================================
export interface SessionUser {
  userId: string; email: string; name: string; role: Role; orgId: string | null;
  isOnboarded: boolean; passwordChangeRequired: boolean;
}

export const authApi = {
  async login(email: string, password: string): Promise<SessionUser> {
    await delay();
    const user = db().users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error('No account found for this email address.');
    if (user.isLocked) throw new Error('This account is locked. Contact your administrator.');
    if (user.isDeactivated) throw new Error('This account has been deactivated.');
    if (user.password !== password) throw new Error('Incorrect password. Please try again.');
    user.lastLogin = new Date().toISOString();
    db().securityLogs.unshift({
      id: uid('sl'), eventType: 'LOGIN_SUCCESS', email: user.email,
      ipAddress: '102.89.34.12', orgId: user.orgId, createdAt: new Date().toISOString(),
    });
    persist();
    return {
      userId: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`,
      role: user.role, orgId: user.orgId, isOnboarded: user.isOnboarded,
      passwordChangeRequired: user.passwordChangeRequired,
    };
  },
  async requestPasswordReset(email: string): Promise<boolean> {
    await delay();
    db().securityLogs.push({
      id: uid('sl'), eventType: 'PASSWORD_RESET_REQUEST', email,
      ipAddress: '127.0.0.1', orgId: null, createdAt: new Date().toISOString(),
    });
    persist();
    return true;
  },
  async resetPassword(_token: string, newPassword: string): Promise<boolean> {
    await delay();
    persist();
    return newPassword.length >= 8;
  },
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<SessionUser> {
    await delay();
    const user = db().users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.password !== oldPassword) throw new Error('Current password is incorrect.');
    user.password = newPassword;
    user.passwordChangeRequired = false;
    if (user.tempPassword) user.tempPassword = undefined;
    persist();
    return {
      userId: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`,
      role: user.role, orgId: user.orgId, isOnboarded: user.isOnboarded, passwordChangeRequired: false,
    };
  },
};

// ============================================================
// ORGANIZATIONS (multi-tenant core)
// ============================================================
export const orgsApi = {
  async list(): Promise<Organization[]> {
    await delay();
    return clone(db().organizations);
  },
  async get(orgId: string): Promise<Organization | null> {
    await delay();
    return clone(db().organizations.find(o => o.id === orgId) ?? null);
  },
  async create(payload: {
    name: string; shortName: string; type: OrgType; country: string;
    description: string; mission: string; website: string; contactEmail: string;
    colors: Organization['colors']; terminology: Organization['terminology'];
    adminFirst: string; adminLast: string; adminEmail: string;
  }): Promise<Organization> {
    await delay();
    const orgId = uid('org');
    const adminId = uid('u');
    const initials = payload.shortName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'OR';
    const org: Organization = {
      id: orgId, name: payload.name, shortName: payload.shortName,
      slug: payload.shortName.toLowerCase().replace(/\s+/g, '-'),
      type: payload.type, description: payload.description, mission: payload.mission,
      website: payload.website, contactEmail: payload.contactEmail, contactPhone: '',
      country: payload.country, foundedYear: new Date().getFullYear(),
      colors: payload.colors,
      logoStyle: { initials, bg: payload.colors.primary, fg: '#FFFFFF' },
      logoDataUrl: null, terminology: payload.terminology,
      settings: { strictVerification: true, opportunityModeration: true, allowGuestView: false, emailNotificationsDefault: true },
      socialLinks: {}, status: 'ACTIVE', createdAt: new Date().toISOString(),
    };
    db().organizations.push(org);
    db().users.push({
      id: adminId, orgId, firstName: payload.adminFirst, lastName: payload.adminLast,
      email: payload.adminEmail, password: DEMO_PASSWORD, tempPassword: 'Welcome@2026',
      role: 'ADMIN', isOnboarded: true, passwordChangeRequired: true, isActive: true,
      isLocked: false, isVerified: true, isDeactivated: false,
      lastLogin: null, createdAt: new Date().toISOString(), language: 'en', theme: 'system',
      emailNotifications: true,
      profile: { title: 'Administrator', sectors: [], skills: [], offers: [], needs: [], contactVisibility: 'ADMIN_ONLY' },
    });
    db().securityLogs.unshift({
      id: uid('sl'), eventType: 'LOGIN_SUCCESS', email: 'super@unleashified.io',
      ipAddress: '154.72.16.203', orgId, createdAt: new Date().toISOString(),
    });
    persist();
    return clone(org);
  },
  async update(orgId: string, patch: Partial<Organization>): Promise<Organization> {
    await delay();
    const org = db().organizations.find(o => o.id === orgId);
    if (!org) throw new Error('Organization not found.');
    Object.assign(org, patch);
    persist();
    return clone(org);
  },
  async updateBranding(orgId: string, branding: {
    name?: string; shortName?: string; description?: string; mission?: string;
    website?: string; contactEmail?: string; contactPhone?: string; country?: string;
    colors?: Organization['colors']; logoDataUrl?: string | null;
    socialLinks?: Organization['socialLinks'];
  }): Promise<Organization> {
    await delay();
    const org = db().organizations.find(o => o.id === orgId);
    if (!org) throw new Error('Organization not found.');
    Object.assign(org, branding);
    persist();
    return clone(org);
  },
  async updateTerminology(orgId: string, terminology: Organization['terminology']): Promise<Organization> {
    await delay();
    const org = db().organizations.find(o => o.id === orgId);
    if (!org) throw new Error('Organization not found.');
    org.terminology = terminology;
    persist();
    return clone(org);
  },
  async updateSettings(orgId: string, settings: Partial<Organization['settings']>): Promise<Organization> {
    await delay();
    const org = db().organizations.find(o => o.id === orgId);
    if (!org) throw new Error('Organization not found.');
    Object.assign(org.settings, settings);
    persist();
    return clone(org);
  },
};

// ============================================================
// USERS
// ============================================================
export const usersApi = {
  async get(userId: string): Promise<User | null> {
    await delay();
    return clone(db().users.find(u => u.id === userId) ?? null);
  },
  async listByOrg(orgId: string): Promise<User[]> {
    await delay();
    return clone(db().users.filter(u => u.orgId === orgId && !u.isDeactivated));
  },
  async searchDirectory(orgId: string, excludeUserId: string): Promise<User[]> {
    await delay();
    return clone(db().users.filter(u => u.orgId === orgId && u.id !== excludeUserId && u.isActive && !u.isLocked && u.isOnboarded));
  },
  async create(orgId: string, payload: { firstName: string; lastName: string; email: string; role?: Role }): Promise<User> {
    await delay();
    if (db().users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error('A user with this email already exists.');
    }
    const user: User = {
      id: uid('u'), orgId, firstName: payload.firstName, lastName: payload.lastName,
      email: payload.email, password: DEMO_PASSWORD, tempPassword: 'Welcome@2026',
      role: payload.role ?? 'MEMBER', isOnboarded: false, passwordChangeRequired: true,
      isActive: true, isLocked: false, isVerified: false, isDeactivated: false,
      lastLogin: null, createdAt: new Date().toISOString(), language: 'en', theme: 'system',
      emailNotifications: true,
      profile: { sectors: [], skills: [], offers: [], needs: [], contactVisibility: 'EVERYONE' },
    };
    db().users.push(user);
    persist();
    return clone(user);
  },
  async bulkCreate(orgId: string, rows: { firstName: string; lastName: string; email: string }[]): Promise<{ created: number; skipped: number }> {
    await delay();
    let created = 0, skipped = 0;
    for (const row of rows) {
      if (!row.firstName || !row.lastName || !row.email) { skipped++; continue; }
      if (db().users.some(u => u.email.toLowerCase() === row.email.toLowerCase())) { skipped++; continue; }
      db().users.push({
        id: uid('u'), orgId, firstName: row.firstName, lastName: row.lastName, email: row.email,
        password: DEMO_PASSWORD, tempPassword: 'Welcome@2026', role: 'MEMBER',
        isOnboarded: false, passwordChangeRequired: true, isActive: true, isLocked: false,
        isVerified: false, isDeactivated: false, lastLogin: null, createdAt: new Date().toISOString(),
        language: 'en', theme: 'system', emailNotifications: true,
        profile: { sectors: [], skills: [], offers: [], needs: [], contactVisibility: 'EVERYONE' },
      });
      created++;
    }
    persist();
    return { created, skipped };
  },
  async update(userId: string, patch: Partial<User>): Promise<User> {
    await delay();
    const user = db().users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (patch.profile) Object.assign(user.profile, patch.profile);
    const { profile: _profile, ...rest } = patch;
    if (Object.keys(rest).length) Object.assign(user, rest);
    persist();
    return clone(user);
  },
  async verify(userId: string): Promise<User> {
    await delay();
    return usersApi.update(userId, { isVerified: true });
  },
  async changeRole(userId: string, role: Role): Promise<User> {
    await delay();
    const user = db().users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.role = role;
    db().securityLogs.unshift({
      id: uid('sl'), eventType: 'ROLE_CHANGED', email: user.email,
      ipAddress: '154.72.16.203', orgId: user.orgId, createdAt: new Date().toISOString(),
    });
    persist();
    return clone(user);
  },
  async setStatus(userId: string, action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'delete'): Promise<boolean> {
    await delay();
    const d = db();
    const idx = d.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');
    const user = d.users[idx];
    if (action === 'delete') {
      d.users.splice(idx, 1);
      d.posts = d.posts.filter(p => p.authorId !== userId);
      persist();
      return true;
    }
    if (action === 'activate') { user.isActive = true; user.isLocked = false; }
    if (action === 'deactivate') user.isActive = false;
    if (action === 'lock') {
      user.isLocked = true;
      d.securityLogs.unshift({ id: uid('sl'), eventType: 'ACCOUNT_LOCKED', email: user.email, ipAddress: '154.72.16.203', orgId: user.orgId, createdAt: new Date().toISOString() });
    }
    if (action === 'unlock') { user.isLocked = false; user.isActive = true; }
    persist();
    return true;
  },
  async setupProfile(userId: string, profile: Partial<User['profile']>): Promise<User> {
    await delay();
    const user = db().users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    Object.assign(user.profile, profile);
    user.isOnboarded = true;
    persist();
    return clone(user);
  },
  async deactivateAccount(userId: string): Promise<boolean> {
    await delay();
    const user = db().users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.isDeactivated = true;
    user.firstName = 'Removed';
    user.lastName = 'Member';
    user.email = `removed-${userId}@anonymized.local`;
    user.profile = { sectors: [], skills: [], offers: [], needs: [], contactVisibility: 'ADMIN_ONLY' };
    persist();
    return true;
  },
};

// ============================================================
// POSTS (social feed + group feed)
// ============================================================
export const postsApi = {
  async listFeed(orgId: string): Promise<Post[]> {
    await delay();
    return clone(db().posts.filter(p => p.orgId === orgId && !p.groupId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async listReported(orgId: string): Promise<Post[]> {
    await delay();
    return clone(db().posts.filter(p => p.orgId === orgId && (p.reports.length > 0 || p.status === 'HIDDEN')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async listGroupPosts(groupId: string): Promise<Post[]> {
    await delay();
    return clone(db().posts.filter(p => p.groupId === groupId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async create(payload: { orgId: string; authorId: string; body: string; imageUrls?: string[]; groupId?: string }): Promise<Post> {
    await delay();
    const post: Post = {
      id: uid('p'), orgId: payload.orgId, groupId: payload.groupId ?? null, authorId: payload.authorId,
      body: payload.body, postType: 'SOCIAL', imageUrls: payload.imageUrls ?? [], videoUrl: null,
      likedBy: [], comments: [], savedBy: [], createdAt: new Date().toISOString(),
      status: 'ACTIVE', reports: [],
    };
    db().posts.unshift(post);
    persist();
    return clone(post);
  },
  async toggleLike(postId: string, userId: string): Promise<Post> {
    await delay();
    const post = db().posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    const liked = post.likedBy.includes(userId);
    post.likedBy = liked ? post.likedBy.filter(id => id !== userId) : [...post.likedBy, userId];
    if (!liked && post.authorId !== userId) {
      pushNotification(post.authorId, 'POST_LIKE', 'New like on your post', `${userName(userId)} liked your post.`);
    }
    persist();
    return clone(post);
  },
  async toggleSave(postId: string, userId: string): Promise<Post> {
    await delay();
    const post = db().posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    post.savedBy = post.savedBy.includes(userId) ? post.savedBy.filter(id => id !== userId) : [...post.savedBy, userId];
    persist();
    return clone(post);
  },
  async listSaved(userId: string): Promise<Post[]> {
    await delay();
    return clone(db().posts.filter(p => p.savedBy.includes(userId)));
  },
  async listMyPosts(userId: string): Promise<Post[]> {
    await delay();
    return clone(db().posts.filter(p => p.authorId === userId));
  },
  async addComment(postId: string, authorId: string, body: string): Promise<Post> {
    await delay();
    const post = db().posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    post.comments.push({ id: uid('c'), authorId, body, createdAt: new Date().toISOString() });
    if (post.authorId !== authorId) {
      pushNotification(post.authorId, 'POST_COMMENT', 'New comment on your post', `${userName(authorId)} commented: "${body.slice(0, 60)}${body.length > 60 ? '…' : ''}"`);
    }
    persist();
    return clone(post);
  },
  async update(postId: string, body: string): Promise<Post> {
    await delay();
    const post = db().posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    post.body = body;
    persist();
    return clone(post);
  },
  async delete(postId: string): Promise<boolean> {
    await delay();
    const d = db();
    d.posts = d.posts.filter(p => p.id !== postId);
    persist();
    return true;
  },
  async report(postId: string, userId: string, reason: Post['reports'][number]['reason'], description?: string): Promise<Post> {
    await delay();
    const post = db().posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    post.reports.push({ id: uid('r'), reason, description, reportedBy: userId, createdAt: new Date().toISOString() });
    post.status = 'REPORTED';
    persist();
    return clone(post);
  },
  async setVisibility(postId: string, status: Post['status']): Promise<Post> {
    await delay();
    const post = db().posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found.');
    post.status = status;
    persist();
    return clone(post);
  },
};

// ============================================================
// OFFICIAL NEWS
// ============================================================
export const newsApi = {
  async list(orgId: string): Promise<OfficialNews[]> {
    await delay();
    return clone(db().news.filter(n => n.orgId === orgId).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
  },
  async create(payload: { orgId: string; authorId: string; title: string; content: string; category: string; coverImage?: string | null }): Promise<OfficialNews> {
    await delay();
    const item: OfficialNews = {
      id: uid('n'), orgId: payload.orgId, title: payload.title, content: payload.content,
      category: payload.category || 'Announcement', coverImage: payload.coverImage ?? svgImage(payload.title.slice(0, 24).toUpperCase(), '#1B2F5B', '#ED202D'),
      publishedAt: new Date().toISOString(), views: 0, authorId: payload.authorId, status: 'published',
    };
    db().news.unshift(item);
    persist();
    return clone(item);
  },
  async update(id: string, patch: Partial<OfficialNews>): Promise<OfficialNews> {
    await delay();
    const item = db().news.find(n => n.id === id);
    if (!item) throw new Error('News item not found.');
    Object.assign(item, patch);
    persist();
    return clone(item);
  },
  async delete(id: string): Promise<boolean> {
    await delay();
    const d = db();
    d.news = d.news.filter(n => n.id !== id);
    persist();
    return true;
  },
  async incrementViews(id: string): Promise<void> {
    const item = db().news.find(n => n.id === id);
    if (item) { item.views++; persist(); }
  },
};

// ============================================================
// CONNECTIONS
// ============================================================
export const connectionsApi = {
  async network(orgId: string, userId: string) {
    await delay();
    const conns = db().connections.filter(c => c.orgId === orgId && (c.requesterId === userId || c.recipientId === userId));
    return clone(conns);
  },
  async connect(orgId: string, requesterId: string, recipientId: string): Promise<Connection> {
    await delay();
    const existing = db().connections.find(c =>
      c.orgId === orgId && ((c.requesterId === requesterId && c.recipientId === recipientId) || (c.requesterId === recipientId && c.recipientId === requesterId)));
    if (existing) throw new Error('A connection request already exists between you.');
    const conn: Connection = { id: uid('cn'), orgId, requesterId, recipientId, status: 'PENDING', createdAt: new Date().toISOString() };
    db().connections.push(conn);
    pushNotification(recipientId, 'CONNECTION_REQUEST', 'New connection request', `${userName(requesterId)} wants to connect with you.`);
    persist();
    return clone(conn);
  },
  async respond(connectionId: string, action: 'accept' | 'ignore' | 'decline' | 'remove'): Promise<boolean> {
    await delay();
    const conn = db().connections.find(c => c.id === connectionId);
    if (!conn) throw new Error('Connection not found.');
    if (action === 'remove') {
      db().connections = db().connections.filter(c => c.id !== connectionId);
    } else if (action === 'accept') {
      conn.status = 'ACCEPTED';
      conn.connectedSince = new Date().toISOString();
      pushNotification(conn.requesterId, 'CONNECTION_ACCEPTED', 'Connection accepted', `${userName(conn.recipientId)} accepted your connection request.`);
    } else {
      conn.status = action === 'ignore' ? 'IGNORED' : 'DECLINED';
    }
    persist();
    return true;
  },
  async suggestions(orgId: string, userId: string): Promise<User[]> {
    await delay();
    const myConns = db().connections.filter(c => c.orgId === orgId && (c.requesterId === userId || c.recipientId === userId));
    const connectedOrPending = new Set(myConns.flatMap(c => [c.requesterId, c.recipientId]));
    return clone(db().users.filter(u =>
      u.orgId === orgId && u.id !== userId && u.isOnboarded && u.isActive && !u.isLocked && !connectedOrPending.has(u.id)).slice(0, 6));
  },
};

// ============================================================
// GROUPS
// ============================================================
export const groupsApi = {
  async list(orgId: string): Promise<Group[]> {
    await delay();
    return clone(db().groups.filter(g => g.orgId === orgId && g.status !== 'PENDING_APPROVAL'));
  },
  async listAdmin(orgId: string): Promise<Group[]> {
    await delay();
    return clone(db().groups.filter(g => g.orgId === orgId));
  },
  async get(groupId: string): Promise<Group | null> {
    await delay();
    return clone(db().groups.find(g => g.id === groupId) ?? null);
  },
  async create(payload: { orgId: string; createdBy: string; name: string; description: string; privacyMode: 'PUBLIC' | 'CLOSED'; coverImage?: string | null }): Promise<Group> {
    await delay();
    const group: Group = {
      id: uid('g'), orgId: payload.orgId, name: payload.name, description: payload.description,
      privacyMode: payload.privacyMode, status: 'ACTIVE',
      members: [{ userId: payload.createdBy, memberRole: 'ADMIN', joinedAt: new Date().toISOString() }],
      coverImage: payload.coverImage, createdBy: payload.createdBy, createdAt: new Date().toISOString(),
      joinRequests: [], inviteToken: uid('invite'), likedBy: [], reportReason: null, reportedBy: null,
    };
    db().groups.push(group);
    persist();
    return clone(group);
  },
  async join(groupId: string, userId: string): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    if (group.members.some(m => m.userId === userId)) return clone(group);
    if (group.privacyMode === 'CLOSED') {
      group.joinRequests.push({ id: uid('jr'), userId, createdAt: new Date().toISOString() });
      persist();
      return clone(group);
    }
    group.members.push({ userId, memberRole: 'MEMBER', joinedAt: new Date().toISOString() });
    persist();
    return clone(group);
  },
  async leave(groupId: string, userId: string): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    group.members = group.members.filter(m => m.userId !== userId);
    persist();
    return clone(group);
  },
  async respondJoinRequest(groupId: string, requestId: string, action: 'approve' | 'reject'): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    const req = group.joinRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');
    group.joinRequests = group.joinRequests.filter(r => r.id !== requestId);
    if (action === 'approve') group.members.push({ userId: req.userId, memberRole: 'MEMBER', joinedAt: new Date().toISOString() });
    persist();
    return clone(group);
  },
  async removeMember(groupId: string, userId: string): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    group.members = group.members.filter(m => m.userId !== userId);
    persist();
    return clone(group);
  },
  async setStatus(groupId: string, status: Group['status'], reason?: string): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    group.status = status;
    if (status === 'LOCKED' && reason) group.reportReason = reason;
    persist();
    return clone(group);
  },
  async approve(groupId: string, action: 'approve' | 'reject', reason?: string): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    group.status = action === 'approve' ? 'ACTIVE' : 'REJECTED';
    if (reason) group.reportReason = reason;
    persist();
    return clone(group);
  },
  async like(groupId: string, userId: string): Promise<Group> {
    await delay();
    const group = db().groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');
    group.likedBy = group.likedBy.includes(userId) ? group.likedBy.filter(id => id !== userId) : [...group.likedBy, userId];
    persist();
    return clone(group);
  },
};

// ============================================================
// EVENTS
// ============================================================
export const eventsApi = {
  async list(orgId: string): Promise<AppEvent[]> {
    await delay();
    return clone(db().events.filter(e => e.orgId === orgId && e.status !== 'REJECTED').sort((a, b) => a.startTime.localeCompare(b.startTime)));
  },
  async listAdmin(orgId: string): Promise<AppEvent[]> {
    await delay();
    return clone(db().events.filter(e => e.orgId === orgId).sort((a, b) => a.startTime.localeCompare(b.startTime)));
  },
  async get(eventId: string): Promise<AppEvent | null> {
    await delay();
    return clone(db().events.find(e => e.id === eventId) ?? null);
  },
  async create(payload: Partial<AppEvent> & { orgId: string; createdBy: string }): Promise<AppEvent> {
    await delay();
    const ev: AppEvent = {
      id: uid('e'), orgId: payload.orgId, name: payload.name ?? 'Untitled event',
      description: payload.description ?? '', type: payload.type ?? 'online',
      timeZone: payload.timeZone ?? 'Africa/Lagos', startTime: payload.startTime ?? new Date().toISOString(),
      endTime: payload.endTime ?? payload.startTime ?? new Date().toISOString(),
      externalLink: payload.externalLink, address: payload.address, venue: payload.venue,
      coverImage: payload.coverImage ?? svgImage((payload.name ?? 'EVENT').slice(0, 20).toUpperCase(), '#1B2F5B', '#233389'),
      createdBy: payload.createdBy, attendeeIds: [], waitlistIds: [], capacity: payload.capacity ?? 100,
      status: 'ACTIVE', visibility: payload.visibility ?? 'PUBLIC', createdAt: new Date().toISOString(),
    };
    db().events.push(ev);
    persist();
    return clone(ev);
  },
  async register(eventId: string, userId: string): Promise<{ waitlisted: boolean }> {
    await delay();
    const ev = db().events.find(e => e.id === eventId);
    if (!ev) throw new Error('Event not found.');
    if (ev.attendeeIds.includes(userId)) return { waitlisted: false };
    if (ev.attendeeIds.length >= ev.capacity) {
      ev.waitlistIds.push(userId);
      persist();
      return { waitlisted: true };
    }
    ev.attendeeIds.push(userId);
    if (ev.createdBy !== userId) {
      pushNotification(ev.createdBy, 'EVENT_REGISTRATION', 'New event registration', `${userName(userId)} registered for ${ev.name}.`);
    }
    persist();
    return { waitlisted: false };
  },
  async unregister(eventId: string, userId: string): Promise<boolean> {
    await delay();
    const ev = db().events.find(e => e.id === eventId);
    if (!ev) throw new Error('Event not found.');
    ev.attendeeIds = ev.attendeeIds.filter(id => id !== userId);
    // promote from waitlist if possible
    if (ev.waitlistIds.length > 0 && ev.attendeeIds.length < ev.capacity) {
      const promoted = ev.waitlistIds.shift();
      if (promoted) {
        ev.attendeeIds.push(promoted);
        pushNotification(promoted, 'EVENT_UPDATE', 'You\'re off the waitlist!', `A spot opened up at ${ev.name} — you have been auto-promoted.`);
      }
    }
    persist();
    return true;
  },
  async setStatus(eventId: string, status: AppEvent['status']): Promise<AppEvent> {
    await delay();
    const ev = db().events.find(e => e.id === eventId);
    if (!ev) throw new Error('Event not found.');
    ev.status = status;
    persist();
    return clone(ev);
  },
  async setVisibility(eventId: string, visibility: AppEvent['visibility']): Promise<AppEvent> {
    await delay();
    const ev = db().events.find(e => e.id === eventId);
    if (!ev) throw new Error('Event not found.');
    ev.visibility = visibility;
    persist();
    return clone(ev);
  },
  async remove(eventId: string): Promise<boolean> {
    await delay();
    const d = db();
    d.events = d.events.filter(e => e.id !== eventId);
    persist();
    return true;
  },
};

// ============================================================
// MESSAGING (with simulated incoming replies)
// ============================================================
const CANNED_REPLIES = [
  'Sounds good — let me look at it and revert.',
  'Agreed. Can we sync tomorrow morning?',
  'Great point, I had not considered that angle.',
  'Sending you the details shortly.',
  'Perfect, that works for me.',
  'Let me check with the team and get back to you today.',
];

export const messagingApi = {
  async conversations(orgId: string, userId: string) {
    await delay();
    const convs = db().conversations.filter(c => c.orgId === orgId && c.participantIds.includes(userId));
    return clone(convs.map(c => ({
      ...c,
      messages: c.messages.slice(-50),
    })).sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.createdAt ?? a.createdAt;
      const lb = b.messages[b.messages.length - 1]?.createdAt ?? b.createdAt;
      return lb.localeCompare(la);
    }));
  },
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    await delay();
    const conv = db().conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found.');
    const msg: Message = {
      id: uid('m'), conversationId, senderId, content,
      createdAt: new Date().toISOString(), status: 'delivered', mediaType: null, mediaUrl: null,
    };
    conv.messages.push(msg);
    conv.readBy[senderId] = msg.id;
    persist();
    // Simulated reply from the other participant(s) after a delay
    const others = conv.participantIds.filter(p => p !== senderId);
    if (others.length > 0) {
      const replierId = others[Math.floor(Math.random() * others.length)];
      const replyContent = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
      setTimeout(() => {
        const c = db().conversations.find(x => x.id === conversationId);
        if (!c) return;
        c.messages.push({
          id: uid('m'), conversationId, senderId: replierId, content: replyContent,
          createdAt: new Date().toISOString(), status: 'delivered', mediaType: null, mediaUrl: null,
        });
        persist();
        window.dispatchEvent(new CustomEvent('mock-db-message', { detail: { conversationId } }));
      }, 2500 + Math.random() * 2500);
    }
    return clone(msg);
  },
  async markRead(conversationId: string, userId: string): Promise<boolean> {
    const conv = db().conversations.find(c => c.id === conversationId);
    if (!conv) return false;
    const last = conv.messages[conv.messages.length - 1];
    if (last) conv.readBy[userId] = last.id;
    persist();
    return true;
  },
  async startDirect(orgId: string, requesterId: string, recipientId: string, firstMessage: string): Promise<Conversation> {
    await delay();
    const existing = db().conversations.find(c =>
      c.type === 'DIRECT' && c.participantIds.includes(requesterId) && c.participantIds.includes(recipientId));
    if (existing) {
      const msg: Message = {
        id: uid('m'), conversationId: existing.id, senderId: requesterId, content: firstMessage,
        createdAt: new Date().toISOString(), status: 'delivered', mediaType: null, mediaUrl: null,
      };
      existing.messages.push(msg);
      persist();
      return clone(existing);
    }
    const conv: Conversation = {
      id: uid('cv'), orgId, type: 'DIRECT', participantIds: [requesterId, recipientId],
      messages: [{
        id: uid('m'), conversationId: '', senderId: requesterId, content: firstMessage,
        createdAt: new Date().toISOString(), status: 'delivered', mediaType: null, mediaUrl: null,
      }],
      createdBy: requesterId, createdAt: new Date().toISOString(), readBy: {},
    };
    conv.messages[0].conversationId = conv.id;
    db().conversations.push(conv);
    persist();
    return clone(conv);
  },
  async deleteConversation(conversationId: string): Promise<boolean> {
    await delay();
    const d = db();
    d.conversations = d.conversations.filter(c => c.id !== conversationId);
    persist();
    return true;
  },
};

// ============================================================
// DEAL ROOMS
// ============================================================
export const dealRoomsApi = {
  async list(orgId: string, userId: string): Promise<DealRoom[]> {
    await delay();
    return clone(db().dealRooms.filter(r => r.orgId === orgId && r.members.some(m => m.userId === userId)));
  },
  async listAdmin(orgId: string): Promise<DealRoom[]> {
    await delay();
    return clone(db().dealRooms.filter(r => r.orgId === orgId));
  },
  async get(roomId: string): Promise<DealRoom | null> {
    await delay();
    return clone(db().dealRooms.find(r => r.id === roomId) ?? null);
  },
  async create(payload: { orgId: string; createdBy: string; roomName: string; roomDescription: string; memberIds: string[] }): Promise<DealRoom> {
    await delay();
    const room: DealRoom = {
      id: uid('dr'), orgId: payload.orgId, roomName: payload.roomName, roomDescription: payload.roomDescription,
      createdBy: payload.createdBy, createdAt: new Date().toISOString(), isActive: true, status: 'ACTIVE',
      members: [
        { userId: payload.createdBy, ndaSigned: false, ndaSignedAt: null, role: 'OWNER', joinedAt: new Date().toISOString() },
        ...payload.memberIds.map(id => ({ userId: id, ndaSigned: false, ndaSignedAt: null, role: 'MEMBER' as const, joinedAt: new Date().toISOString() })),
      ],
      messages: [], files: [], auditLog: [{ id: uid('al'), action: 'Room created', performedBy: payload.createdBy, timestamp: new Date().toISOString() }],
    };
    db().dealRooms.push(room);
    persist();
    return clone(room);
  },
  async signNda(roomId: string, userId: string): Promise<DealRoom> {
    await delay();
    const room = db().dealRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');
    const member = room.members.find(m => m.userId === userId);
    if (!member) throw new Error('You are not a member of this room.');
    member.ndaSigned = true;
    member.ndaSignedAt = new Date().toISOString();
    room.auditLog.push({ id: uid('al'), action: `NDA signed — ${userName(userId)}`, performedBy: userId, timestamp: new Date().toISOString() });
    persist();
    return clone(room);
  },
  async sendMessage(roomId: string, senderId: string, content: string): Promise<DealRoomMessage> {
    await delay();
    const room = db().dealRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');
    const msg: DealRoomMessage = { id: uid('dm'), senderId, content, createdAt: new Date().toISOString() };
    room.messages.push(msg);
    room.auditLog.push({ id: uid('al'), action: 'Message posted', performedBy: senderId, timestamp: new Date().toISOString() });
    persist();
    // Simulated reply from another member
    const others = room.members.filter(m => m.userId !== senderId);
    if (others.length > 0) {
      const replier = others[Math.floor(Math.random() * others.length)].userId;
      setTimeout(() => {
        const r = db().dealRooms.find(x => x.id === roomId);
        if (!r) return;
        r.messages.push({
          id: uid('dm'), senderId: replier,
          content: CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)],
          createdAt: new Date().toISOString(),
        });
        persist();
        window.dispatchEvent(new CustomEvent('mock-db-message', { detail: { dealRoomId: roomId } }));
      }, 3000 + Math.random() * 3000);
    }
    return clone(msg);
  },
  async uploadFile(roomId: string, file: { name: string; size: number }, uploadedBy: string): Promise<DealRoomFile> {
    await delay();
    const room = db().dealRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');
    const f: DealRoomFile = { id: uid('df'), name: file.name, size: file.size, uploadedBy, createdAt: new Date().toISOString() };
    room.files.push(f);
    room.auditLog.push({ id: uid('al'), action: `Document uploaded — ${file.name}`, performedBy: uploadedBy, timestamp: new Date().toISOString() });
    persist();
    return clone(f);
  },
  async addMembers(roomId: string, userIds: string[], addedBy: string): Promise<DealRoom> {
    await delay();
    const room = db().dealRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');
    for (const id of userIds) {
      if (!room.members.some(m => m.userId === id)) {
        room.members.push({ userId: id, ndaSigned: false, ndaSignedAt: null, role: 'MEMBER', joinedAt: new Date().toISOString() });
        room.auditLog.push({ id: uid('al'), action: `Member added — ${userName(id)}`, performedBy: addedBy, timestamp: new Date().toISOString() });
      }
    }
    persist();
    return clone(room);
  },
  async removeMember(roomId: string, userId: string): Promise<DealRoom> {
    await delay();
    const room = db().dealRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');
    room.members = room.members.filter(m => m.userId !== userId);
    persist();
    return clone(room);
  },
  async setStatus(roomId: string, action: 'approve' | 'reject' | 'lock' | 'unlock' | 'delete', reason?: string): Promise<boolean> {
    await delay();
    const d = db();
    const room = d.dealRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');
    if (action === 'delete') { d.dealRooms = d.dealRooms.filter(r => r.id !== roomId); persist(); return true; }
    if (action === 'approve') room.status = 'ACTIVE';
    if (action === 'reject') room.status = 'PENDING_APPROVAL';
    if (action === 'lock') { room.isActive = false; room.auditLog.push({ id: uid('al'), action: 'Room locked', performedBy: 'admin', timestamp: new Date().toISOString(), reason }); }
    if (action === 'unlock') room.isActive = true;
    persist();
    return true;
  },
};

// ============================================================
// RESOURCES
// ============================================================
export const resourcesApi = {
  async list(orgId: string): Promise<Resource[]> {
    await delay();
    return clone(db().resources.filter(r => r.orgId === orgId && r.status !== 'ARCHIVED'));
  },
  async listAdmin(orgId: string): Promise<Resource[]> {
    await delay();
    return clone(db().resources.filter(r => r.orgId === orgId));
  },
  async create(payload: { orgId: string; uploadedBy: string; title: string; description: string; category: Resource['category']; visibility: Resource['visibility'] }): Promise<Resource> {
    await delay();
    const res: Resource = {
      id: uid('res'), orgId: payload.orgId, title: payload.title, description: payload.description,
      category: payload.category, isVideo: payload.category === 'videos', fileType: payload.category === 'videos' ? 'MP4' : 'PDF',
      downloads: 0, uploadedBy: payload.uploadedBy, visibility: payload.visibility,
      status: payload.uploadedBy.startsWith('u-admin') ? 'ACTIVE' : 'PENDING', createdAt: new Date().toISOString(),
    };
    db().resources.push(res);
    persist();
    return clone(res);
  },
  async download(resourceId: string): Promise<void> {
    const res = db().resources.find(r => r.id === resourceId);
    if (res) { res.downloads++; persist(); }
  },
  async review(resourceId: string, action: 'approve' | 'reject'): Promise<Resource> {
    await delay();
    const res = db().resources.find(r => r.id === resourceId);
    if (!res) throw new Error('Resource not found.');
    res.status = action === 'approve' ? 'ACTIVE' : 'ARCHIVED';
    persist();
    return clone(res);
  },
  async remove(resourceId: string): Promise<boolean> {
    await delay();
    const d = db();
    d.resources = d.resources.filter(r => r.id !== resourceId);
    persist();
    return true;
  },
};

// ============================================================
// NOTIFICATIONS
// ============================================================
function pushNotification(userId: string, type: AppNotification['type'], title: string, body: string) {
  db().notifications.push({
    id: uid('nt'), userId, type, title, body, isRead: false, createdAt: new Date().toISOString(),
  });
}

function userName(userId: string): string {
  const u = db().users.find(x => x.id === userId);
  return u ? `${u.firstName} ${u.lastName}` : 'A member';
}

export const notificationsApi = {
  async list(userId: string): Promise<AppNotification[]> {
    await delay();
    return clone(db().notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async unreadCount(userId: string): Promise<number> {
    return db().notifications.filter(n => n.userId === userId && !n.isRead).length;
  },
  async markRead(notificationId: string): Promise<boolean> {
    const n = db().notifications.find(x => x.id === notificationId);
    if (n) { n.isRead = true; persist(); }
    return true;
  },
  async markAllRead(userId: string): Promise<boolean> {
    db().notifications.filter(n => n.userId === userId).forEach(n => { n.isRead = true; });
    persist();
    return true;
  },
};

// ============================================================
// SUPPORT
// ============================================================
export const supportApi = {
  async createTicket(payload: { orgId: string; userId: string; subject: string; message: string }): Promise<SupportTicket> {
    await delay();
    const ticket: SupportTicket = {
      id: uid('st'), orgId: payload.orgId, userId: payload.userId,
      subject: payload.subject, message: payload.message, status: 'UNREAD',
      createdAt: new Date().toISOString(), reviewedAt: null,
    };
    db().supportTickets.push(ticket);
    persist();
    return clone(ticket);
  },
  async listByOrg(orgId: string): Promise<SupportTicket[]> {
    await delay();
    return clone(db().supportTickets.filter(t => t.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async setStatus(ticketId: string, status: SupportTicket['status']): Promise<SupportTicket> {
    await delay();
    const ticket = db().supportTickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found.');
    ticket.status = status;
    ticket.reviewedAt = status === 'UNREAD' ? null : new Date().toISOString();
    persist();
    return clone(ticket);
  },
};

// ============================================================
// SECURITY LOGS
// ============================================================
export const securityApi = {
  async logs(filter?: { orgId?: string | null; limit?: number }): Promise<SecurityLog[]> {
    await delay();
    let logs = db().securityLogs;
    if (filter?.orgId) logs = logs.filter(l => l.orgId === filter.orgId);
    logs = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return clone(logs.slice(0, filter?.limit ?? 50));
  },
  async bruteForce(): Promise<{ ipAddress: string; attempts: number }[]> {
    await delay();
    const map = new Map<string, number>();
    for (const log of db().securityLogs) {
      if (log.eventType === 'LOGIN_FAILED') map.set(log.ipAddress, (map.get(log.ipAddress) ?? 0) + 1);
    }
    return [...map.entries()].filter(([, n]) => n > 1).map(([ipAddress, attempts]) => ({ ipAddress, attempts }));
  },
};

// ============================================================
// ANALYTICS
// ============================================================
export const analyticsApi = {
  async dashboardSummary(orgId: string): Promise<DashboardSummary> {
    await delay();
    const d = db();
    const users = d.users.filter(u => u.orgId === orgId);
    const groups = d.groups.filter(g => g.orgId === orgId);
    const events = d.events.filter(e => e.orgId === orgId);
    const posts = d.posts.filter(p => p.orgId === orgId);
    const rooms = d.dealRooms.filter(r => r.orgId === orgId);
    const tickets = d.supportTickets.filter(t => t.orgId === orgId);
    return {
      totalUsers: users.length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      pendingUsers: users.filter(u => !u.isVerified).length,
      activeUsers: users.filter(u => u.isActive && !u.isLocked).length,
      pendingGroups: groups.filter(g => g.status === 'PENDING_APPROVAL').length,
      totalGroups: groups.filter(g => g.status === 'ACTIVE').length,
      pendingEvents: events.filter(e => e.status === 'PENDING_APPROVAL').length,
      totalEvents: events.filter(e => e.status === 'ACTIVE').length,
      connections: d.connections.filter(c => c.orgId === orgId && c.status === 'ACCEPTED').length,
      totalPosts: posts.length,
      reportedPosts: posts.filter(p => p.reports.length > 0 && p.status !== 'HIDDEN').length,
      hiddenPosts: posts.filter(p => p.status === 'HIDDEN').length,
      supportOpen: tickets.filter(t => t.status !== 'RESOLVED').length,
      dealRooms: rooms.filter(r => r.status === 'ACTIVE').length,
      pendingDealRooms: rooms.filter(r => r.status === 'PENDING_APPROVAL').length,
    };
  },
  async orgAnalytics(orgId: string): Promise<OrgAnalytics> {
    await delay();
    const d = db();
    const users = d.users.filter(u => u.orgId === orgId && u.role === 'MEMBER');
    const byCountry = new Map<string, number>();
    const bySector = new Map<string, number>();
    const byCohort = new Map<string, number>();
    for (const u of users) {
      if (u.profile.location) byCountry.set(u.profile.location, (byCountry.get(u.profile.location) ?? 0) + 1);
      for (const s of u.profile.sectors) bySector.set(s, (bySector.get(s) ?? 0) + 1);
      if (u.profile.cohort) byCohort.set(u.profile.cohort, (byCohort.get(u.profile.cohort) ?? 0) + 1);
    }
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const base = 3 + Math.floor(Math.random() * 4);
    const leaderboard = users.map(u => {
      const myPosts = d.posts.filter(p => p.authorId === u.id).length;
      const myComments = d.posts.filter(p => p.comments.some(c => c.authorId === u.id)).length;
      const myLikes = d.posts.filter(p => p.likedBy.includes(u.id)).length;
      const myConns = d.connections.filter(c => (c.requesterId === u.id || c.recipientId === u.id) && c.status === 'ACCEPTED').length;
      return { userId: u.id, name: `${u.firstName} ${u.lastName}`, activityScore: myPosts * 10 + myComments * 4 + myLikes * 2 + myConns * 5 };
    }).sort((a, b) => b.activityScore - a.activityScore).slice(0, 6);
    return {
      totalMembers: users.length,
      onboardedMembers: users.filter(u => u.isOnboarded).length,
      totalGroups: d.groups.filter(g => g.orgId === orgId && g.status === 'ACTIVE').length,
      totalDealRooms: d.dealRooms.filter(r => r.orgId === orgId).length,
      totalPosts: d.posts.filter(p => p.orgId === orgId).length,
      totalEvents: d.events.filter(e => e.orgId === orgId).length,
      totalCountries: byCountry.size,
      byCountry: [...byCountry.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
      bySector: [...bySector.entries()].map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count),
      byCohort: [...byCohort.entries()].map(([cohort, count]) => ({ cohort, count })).sort((a, b) => a.cohort.localeCompare(b.cohort)),
      byMonth: months.map((month, i) => ({
        month,
        members: Math.max(1, base + Math.floor(Math.sin(i / 2) * 3 + i)),
        posts: Math.max(0, Math.floor(Math.sin(i / 1.5) * 4 + 5)),
        events: Math.max(0, Math.floor(Math.cos(i / 2) * 2 + 2)),
      })),
      leaderboard,
    };
  },
  async platformSummary(): Promise<PlatformSummary> {
    await delay();
    const d = db();
    return {
      totalOrganizations: d.organizations.length,
      totalMembers: d.users.filter(u => u.role === 'MEMBER').length,
      totalAdmins: d.users.filter(u => u.role === 'ADMIN').length,
      totalPosts: d.posts.length,
      totalEvents: d.events.length,
      totalConnections: d.connections.filter(c => c.status === 'ACCEPTED').length,
      pendingOrgs: d.organizations.filter(o => o.status === 'PENDING').length,
      activeOrgs: d.organizations.filter(o => o.status === 'ACTIVE').length,
    };
  },
  async orgOverviews() {
    await delay();
    const d = db();
    return clone(d.organizations.map(org => {
      const users = d.users.filter(u => u.orgId === org.id);
      return {
        org,
        members: users.filter(u => u.role === 'MEMBER').length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        posts: d.posts.filter(p => p.orgId === org.id).length,
        events: d.events.filter(e => e.orgId === org.id).length,
        connections: d.connections.filter(c => c.orgId === org.id && c.status === 'ACCEPTED').length,
        joinedThisMonth: users.filter(u => u.createdAt > new Date(Date.now() - 30 * 86400000).toISOString()).length,
      };
    }));
  },
};

// ============================================================
// SEARCH
// ============================================================
export const searchApi = {
  async search(orgId: string, userId: string, q: string) {
    await delay();
    const d = db();
    const term = q.toLowerCase();
    const users = d.users.filter(u => u.orgId === orgId && u.id !== userId && u.isOnboarded &&
      (`${u.firstName} ${u.lastName}`.toLowerCase().includes(term) || (u.profile.title ?? '').toLowerCase().includes(term) || (u.profile.companyName ?? '').toLowerCase().includes(term)));
    const posts = d.posts.filter(p => p.orgId === orgId && !p.groupId && p.status !== 'HIDDEN' && p.body.toLowerCase().includes(term));
    const events = d.events.filter(e => e.orgId === orgId && e.name.toLowerCase().includes(term));
    const groups = d.groups.filter(g => g.orgId === orgId && g.status === 'ACTIVE' && g.name.toLowerCase().includes(term));
    const newsItems = d.news.filter(n => n.orgId === orgId && n.title.toLowerCase().includes(term));
    return clone({
      people: users, posts, events, groups, news: newsItems,
      counts: { people: users.length, posts: posts.length, events: events.length, groups: groups.length, news: newsItems.length },
    });
  },
};
