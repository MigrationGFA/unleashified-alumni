// ============================================================
// Seed data for the mock JSON-DB (3 organizations, 20+ users)
// ============================================================
import type { Database, User, Organization } from './types';
import { IMAGES, AVATARS } from '../images';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

// Deterministic SVG placeholder image (data URL) — no external images needed
export function svgImage(label: string, c1: string, c2: string, w = 640, h = 360): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.85}" cy="${h * 0.2}" r="${h * 0.3}" fill="rgba(255,255,255,0.08)"/><circle cx="${w * 0.15}" cy="${h * 0.85}" r="${h * 0.22}" fill="rgba(255,255,255,0.06)"/><text x="50%" y="52%" font-family="Arial, sans-serif" font-size="${Math.round(h * 0.075)}" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export const DEMO_PASSWORD = 'demo1234';

// ---------------- Organizations ----------------
const organizations: Organization[] = [
  {
    id: 'org-stp',
    name: 'Seed Transformation Partners Alumni Network',
    shortName: 'STP Network',
    slug: 'stp',
    type: 'UNIVERSITY',
    description: 'The official alumni network of the Seed Transformation Program — connecting founders, operators and investors across Africa and beyond to build, invest and grow together.',
    mission: 'Accelerate the growth of African enterprises by unlocking the collective power of our alumni community.',
    website: 'https://stp-network.org',
    contactEmail: 'hello@stp-network.org',
    contactPhone: '+234 801 234 5678',
    country: 'Nigeria',
    foundedYear: 2019,
    colors: { primary: '#1B2F5B', secondary: '#233389', accent: '#ED202D', highlight: '#FBAD17', sidebar: '#14224A' },
    logoStyle: { initials: 'STP', bg: '#1B2F5B', fg: '#FBAD17' },
    logoDataUrl: null,
    terminology: { cohort: 'Cohort', node: 'Node', member: 'Alumni', community: 'Network' },
    settings: { strictVerification: true, opportunityModeration: true, allowGuestView: false, emailNotificationsDefault: true },
    socialLinks: { linkedin: 'https://linkedin.com/company/stp-network', twitter: 'https://x.com/stpnetwork', instagram: 'https://instagram.com/stpnetwork' },
    status: 'ACTIVE',
    createdAt: daysAgo(540),
  },
  {
    id: 'org-lbs',
    name: 'Lagos Business School Alumni Association',
    shortName: 'LBS Alumni',
    slug: 'lbs',
    type: 'UNIVERSITY',
    description: 'A thriving community of LBS graduates driving excellence in business and leadership across West Africa. Members organize chapter meetups, mentorship circles and sector forums.',
    mission: 'Foster lifelong learning, leadership and enterprise among LBS graduates.',
    website: 'https://lbsalumni.org',
    contactEmail: 'alumni@lbs.edu.ng',
    contactPhone: '+234 701 555 0100',
    country: 'Nigeria',
    foundedYear: 2011,
    colors: { primary: '#14532D', secondary: '#166534', accent: '#B45309', highlight: '#F59E0B', sidebar: '#0B3D20' },
    logoStyle: { initials: 'LBS', bg: '#14532D', fg: '#F59E0B' },
    logoDataUrl: null,
    terminology: { cohort: 'Class Year', node: 'Chapter', member: 'Member', community: 'Association' },
    settings: { strictVerification: true, opportunityModeration: false, allowGuestView: true, emailNotificationsDefault: true },
    socialLinks: { linkedin: 'https://linkedin.com/company/lbs-alumni' },
    status: 'ACTIVE',
    createdAt: daysAgo(420),
  },
  {
    id: 'org-inn',
    name: 'InnovateHub Accelerator Alumni',
    shortName: 'InnovateHub',
    slug: 'innovatehub',
    type: 'ACCELERATOR',
    description: 'Founders from every InnovateHub batch — a dense network of builders sharing playbooks, pipelines and co-investment opportunities.',
    mission: 'Turn batch-mates into co-founders, customers and co-investors.',
    website: 'https://innovatehub.io',
    contactEmail: 'founders@innovatehub.io',
    contactPhone: '+254 711 222 333',
    country: 'Kenya',
    foundedYear: 2021,
    colors: { primary: '#4C1D95', secondary: '#5B21B6', accent: '#BE185D', highlight: '#A78BFA', sidebar: '#3B1673' },
    logoStyle: { initials: 'IH', bg: '#4C1D95', fg: '#E9D5FF' },
    logoDataUrl: null,
    terminology: { cohort: 'Batch', node: 'City Chapter', member: 'Founder', community: 'Hub' },
    settings: { strictVerification: false, opportunityModeration: true, allowGuestView: false, emailNotificationsDefault: false },
    socialLinks: { linkedin: 'https://linkedin.com/company/innovatehub', twitter: 'https://x.com/innovatehub' },
    status: 'ACTIVE',
    createdAt: daysAgo(230),
  },
];

// ---------------- Users ----------------
const baseUser = (over: Partial<User>): User => ({
  orgId: 'org-stp',
  password: DEMO_PASSWORD,
  role: 'MEMBER',
  isOnboarded: true,
  passwordChangeRequired: false,
  isActive: true,
  isLocked: false,
  isVerified: true,
  isDeactivated: false,
  lastLogin: daysAgo(1),
  createdAt: daysAgo(200),
  language: 'en',
  theme: 'system',
  emailNotifications: true,
  profile: {
    sectors: [], skills: [], offers: [], needs: [],
    contactVisibility: 'EVERYONE',
  },
  ...over,
} as User);

const users: User[] = [
  // ---- Platform ----
  baseUser({
    id: 'u-super', orgId: null, firstName: 'Adaora', lastName: 'Nwosu', email: 'super@unleashified.io',
    role: 'SUPERADMIN',
    profile: { sectors: ['Technology'], skills: ['Platform Strategy'], offers: [], needs: [], contactVisibility: 'ADMIN_ONLY' },
    createdAt: daysAgo(540), lastLogin: hoursAgo(3),
  }),
  // ---- STP org ----
  baseUser({
    id: 'u-admin-stp', email: 'admin@stp.org', firstName: 'Grace', lastName: 'Mwangi', role: 'ADMIN',
    profile: { title: 'Community Director', cohort: 'Cohort 3', node: 'Nairobi Node', location: 'Kenya', sectors: ['Education'], skills: ['Community Building'], offers: ['Mentorship'], needs: [], contactVisibility: 'EVERYONE' },
    createdAt: daysAgo(530), lastLogin: hoursAgo(5),
  }),
  baseUser({
    id: 'u-amara', email: 'amara@stp.org', firstName: 'Amara', lastName: 'Okafor',
    profile: {
      title: 'Co-founder & CEO', cohort: 'Cohort 7', node: 'Lagos Node', location: 'Nigeria',
      sectors: ['Technology', 'Financial Services'], skills: ['Fintech', 'Product Strategy', 'Fundraising'],
      goals: 'Scale PayLinx to 1M SME merchants and open a Series A round by Q3.',
      linkedInProfile: 'https://linkedin.com/in/amaraokafor',
      companyName: 'PayLinx', businessModel: 'B2B SaaS', companyStage: '10-50 employees',
      elevatorPitch: 'Embedded payments + working capital for African SME merchants.',
      offers: ['Fundraising advice', 'Product strategy', 'Go-to-market'],
      needs: ['Sales leads', 'Investor introductions'],
      contactVisibility: 'EVERYONE', companyWebsite: 'https://paylinx.africa',
    },
    createdAt: daysAgo(190), lastLogin: minsAgo(12),
  }),
  baseUser({
    id: 'u-david', email: 'david@stp.org', firstName: 'David', lastName: 'Mensah',
    profile: {
      title: 'Head of Operations', cohort: 'Cohort 6', node: 'Accra Node', location: 'Ghana',
      sectors: ['Agriculture', 'Logistics'], skills: ['Supply Chain', 'Operations'],
      goals: 'Digitize agri-export supply chains across West Africa.',
      companyName: 'AgroLink Ghana', businessModel: 'B2B Marketplace', companyStage: '50-200 employees',
      elevatorPitch: 'Cold-chain marketplace connecting rural co-ops to urban retailers.',
      offers: ['Operations', 'Customer introductions'], needs: ['Technical Co-founder', 'Finance advice'],
      contactVisibility: 'CONNECTIONS_ONLY',
    },
    createdAt: daysAgo(180), lastLogin: hoursAgo(20),
  }),
  baseUser({
    id: 'u-fatima', email: 'fatima@stp.org', firstName: 'Fatima', lastName: 'Zahra',
    profile: {
      title: 'VP Product', cohort: 'Cohort 8', node: 'Casablanca Node', location: 'Morocco',
      sectors: ['Technology'], skills: ['Product Strategy', 'Design Thinking', 'Data'],
      goals: 'Launch a pan-African edtech product serving 5M learners.',
      companyName: 'LearnSphere', businessModel: 'B2C', companyStage: 'MVP/Early traction',
      elevatorPitch: 'Mobile-first adaptive learning for Francophone Africa.',
      offers: ['Product strategy', 'Design & UX', 'Mentorship'], needs: ['Fundraising', 'Marketing support'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(170), lastLogin: daysAgo(1),
  }),
  baseUser({
    id: 'u-kwame', email: 'kwame@stp.org', firstName: 'Kwame', lastName: 'Asante',
    profile: {
      title: 'Managing Partner', cohort: 'Cohort 4', node: 'Accra Node', location: 'Ghana',
      sectors: ['Financial Services'], skills: ['Investing', 'M&A', 'Due Diligence'],
      goals: 'Deploy $50M into African early-stage funds over 5 years.',
      companyName: 'Sankofa Capital', businessModel: 'Fund', companyStage: '10-50 employees',
      elevatorPitch: 'Seed fund backing Africa-diaspora returning founders.',
      offers: ['Angel investing', 'M&A advisory', 'Fundraising advice'], needs: ['Deal flow'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(160), lastLogin: daysAgo(2),
  }),
  baseUser({
    id: 'u-ngozi', email: 'ngozi@stp.org', firstName: 'Ngozi', lastName: 'Eze',
    profile: {
      title: 'General Counsel', cohort: 'Cohort 5', node: 'Lagos Node', location: 'Nigeria',
      sectors: ['Legal', 'Financial Services'], skills: ['Contracts', 'Regulatory', 'Compliance'],
      goals: 'Make legal support accessible to every African startup.',
      companyName: 'LexAfrica Partners', businessModel: 'B2B Services', companyStage: '10-50 employees',
      elevatorPitch: 'On-demand general counsel for growth-stage companies.',
      offers: ['Legal & Compliance', 'HR & Talent'], needs: ['Marketing support'],
      contactVisibility: 'CONNECTIONS_ONLY',
    },
    createdAt: daysAgo(150), lastLogin: daysAgo(3),
  }),
  baseUser({
    id: 'u-zainab', email: 'zainab@stp.org', firstName: 'Zainab', lastName: 'Yusuf',
    profile: {
      title: 'Founder', cohort: 'Cohort 9', node: 'Kano Node', location: 'Nigeria',
      sectors: ['Healthcare'], skills: ['HealthTech', 'Operations'],
      goals: 'Bring tele-triage services to Northern Nigeria.',
      companyName: 'ClinicConnect', businessModel: 'B2B2C', companyStage: 'MVP/Early traction',
      elevatorPitch: 'Tele-triage + pharmacy fulfillment for underserved regions.',
      offers: ['Mentorship'], needs: ['Technical Co-founder', 'Investor introductions'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(120), lastLogin: daysAgo(1),
  }),
  baseUser({
    id: 'u-aisha', email: 'aisha@stp.org', firstName: 'Aisha', lastName: 'Bello', isVerified: false,
    profile: {
      title: 'Marketing Lead', cohort: 'Cohort 10', node: 'Lagos Node', location: 'Nigeria',
      sectors: ['Media', 'Consumer Goods'], skills: ['Brand', 'Growth Marketing'],
      goals: 'Build the most loved consumer brand in West Africa.',
      offers: ['Marketing & Growth', 'Media & PR'], needs: ['Product feedback'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(6), lastLogin: null,
  }),
  baseUser({
    id: 'u-chidi', email: 'chidi@stp.org', firstName: 'Chidi', lastName: 'Okafor', isLocked: true, isActive: false,
    profile: { title: 'Consultant', cohort: 'Cohort 2', location: 'Nigeria', sectors: ['Energy'], skills: ['Strategy'], offers: [], needs: [], contactVisibility: 'ADMIN_ONLY' },
    createdAt: daysAgo(300), lastLogin: daysAgo(45),
  }),
  baseUser({
    id: 'u-tunde', email: 'tunde@stp.org', firstName: 'Tunde', lastName: 'Bakare',
    isOnboarded: false, passwordChangeRequired: true, isVerified: true, tempPassword: 'Stp@2026!',
    lastLogin: null, createdAt: daysAgo(1),
    profile: { sectors: [], skills: [], offers: [], needs: [], contactVisibility: 'EVERYONE' },
  }),
  // ---- LBS org ----
  baseUser({
    id: 'u-admin-lbs', orgId: 'org-lbs', email: 'admin@lbs.edu', firstName: 'Bode', lastName: 'Ogundipe', role: 'ADMIN',
    profile: { title: 'Alumni Relations Manager', cohort: 'Class of 2012', node: 'Lagos Chapter', location: 'Nigeria', sectors: ['Education'], skills: ['Events', 'Community'], offers: ['Mentorship'], needs: [], contactVisibility: 'EVERYONE' },
    createdAt: daysAgo(410), lastLogin: daysAgo(1),
  }),
  baseUser({
    id: 'u-yetunde', orgId: 'org-lbs', email: 'yetunde@lbs.edu', firstName: 'Yetunde', lastName: 'Adeyemi',
    profile: {
      title: 'Senior Partner', cohort: 'Class of 2009', node: 'Lagos Chapter', location: 'Nigeria',
      sectors: ['Consulting'], skills: ['Strategy', 'Transformation'],
      goals: 'Anchor a pan-African leadership advisory practice.',
      companyName: 'Adeyemi & Partners', businessModel: 'B2B Services', companyStage: '10-50 employees',
      elevatorPitch: 'Leadership advisory for institutions in transition.',
      offers: ['Mentorship', 'Customer introductions'], needs: ['Board members'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(400), lastLogin: daysAgo(2),
  }),
  baseUser({
    id: 'u-bola', orgId: 'org-lbs', email: 'bola@lbs.edu', firstName: 'Bola', lastName: 'Saraki',
    profile: {
      title: 'Group Head', cohort: 'Class of 2015', node: 'Abuja Chapter', location: 'Nigeria',
      sectors: ['Consumer Goods'], skills: ['P&L Management', 'Sales & BD'],
      goals: 'Take a legacy FMCG brand regional.',
      companyName: 'Zenith Consumer Brands', businessModel: 'D2C', companyStage: '200+ employees',
      elevatorPitch: 'Heritage FMCG brands reimagined for the D2C era.',
      offers: ['Sales & BD'], needs: ['Design help'],
      contactVisibility: 'CONNECTIONS_ONLY',
    },
    createdAt: daysAgo(380), lastLogin: daysAgo(4),
  }),
  baseUser({
    id: 'u-emeka', orgId: 'org-lbs', email: 'emeka@lbs.edu', firstName: 'Emeka', lastName: 'Obi',
    profile: {
      title: 'Founder', cohort: 'Class of 2018', node: 'Enugu Chapter', location: 'Nigeria',
      sectors: ['Real Estate'], skills: ['Development', 'Finance'],
      goals: 'Deliver 5,000 affordable housing units by 2030.',
      companyName: 'Obi Developments', businessModel: 'B2C', companyStage: '50-200 employees',
      elevatorPitch: 'Affordable housing with rent-to-own financing.',
      offers: ['Finance & CFO'], needs: ['Legal advice', 'Strategic partnerships'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(350), lastLogin: daysAgo(5),
  }),
  // ---- InnovateHub org ----
  baseUser({
    id: 'u-admin-inn', orgId: 'org-inn', email: 'admin@innovatehub.io', firstName: 'Lena', lastName: 'Hoffmann', role: 'ADMIN',
    profile: { title: 'Alumni Lead', cohort: 'Batch 1', node: 'Nairobi Chapter', location: 'Kenya', sectors: ['Technology'], skills: ['Community'], offers: ['Mentorship'], needs: [], contactVisibility: 'EVERYONE' },
    createdAt: daysAgo(220), lastLogin: daysAgo(1),
  }),
  baseUser({
    id: 'u-lara', orgId: 'org-inn', email: 'lara@innovatehub.io', firstName: 'Lara', lastName: 'Kimani',
    profile: {
      title: 'Co-founder & CTO', cohort: 'Batch 4', node: 'Nairobi Chapter', location: 'Kenya',
      sectors: ['Technology'], skills: ['AI/ML', 'Backend', 'Cloud'],
      goals: 'Build the data infrastructure layer for African logistics.',
      companyName: 'RafikiData', businessModel: 'B2B SaaS', companyStage: '1-10 employees',
      elevatorPitch: 'ELT pipelines and analytics for logistics operators.',
      offers: ['Technical Co-founder', 'Product strategy'], needs: ['Sales leads', 'Fundraising'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(210), lastLogin: daysAgo(1),
  }),
  baseUser({
    id: 'u-sipho', orgId: 'org-inn', email: 'sipho@innovatehub.io', firstName: 'Sipho', lastName: 'Dlamini',
    profile: {
      title: 'Founder & CEO', cohort: 'Batch 3', node: 'Joburg Chapter', location: 'South Africa',
      sectors: ['Agriculture', 'Technology'], skills: ['Drones', 'Hardware'],
      goals: 'Make precision agriculture affordable for smallholder farmers.',
      companyName: 'SkyFarm', businessModel: 'B2B2C', companyStage: 'MVP/Early traction',
      elevatorPitch: 'Drone-as-a-service crop intelligence for smallholders.',
      offers: ['Go-to-market'], needs: ['Investor introductions', 'Operations help'],
      contactVisibility: 'EVERYONE',
    },
    createdAt: daysAgo(200), lastLogin: daysAgo(3),
  }),
];

// Attach internet-sourced avatar photos to every seeded user
// (the initials fallback still applies for any id missing from AVATARS)
for (const u of users) {
  if (AVATARS[u.id]) u.profile = { ...u.profile, avatarUrl: AVATARS[u.id] };
}

// ---------------- Posts ----------------
const posts: Database['posts'] = [
  {
    id: 'p-1', orgId: 'org-stp', authorId: 'u-amara', postType: 'SOCIAL', category: 'Milestone',
    body: 'Big milestone for PayLinx — we crossed 250,000 active merchants this month, 18 months after launch. What carried us: relentless focus on merchant working capital, and a support team that answers in under 4 minutes. To every founder in this network who took our reference calls with prospective partners — thank you. Next stop: 1M merchants and Series A conversations are officially open. DM me if you want in on the round.',
    imageUrls: [IMAGES.collab[0]], videoUrl: null,
    likedBy: ['u-david', 'u-fatima', 'u-kwame', 'u-ngozi', 'u-zainab', 'u-admin-stp'],
    comments: [
      { id: 'c-1', authorId: 'u-kwame', body: 'Congratulations Amara! Sankofa Capital would love to look at the round — expect my calendar link shortly.', createdAt: hoursAgo(20) },
      { id: 'c-2', authorId: 'u-fatima', body: 'Incredible trajectory. Let us know if LearnSphere can pilot embedded payments for school fees collections.', createdAt: hoursAgo(12) },
      { id: 'c-3', authorId: 'u-david', body: 'Massive! The under-4-minute support SLA is the real story here.', createdAt: hoursAgo(6) },
    ],
    savedBy: ['u-fatima'], createdAt: hoursAgo(26), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-2', orgId: 'org-stp', authorId: 'u-kwame', postType: 'SOCIAL', category: 'Investing',
    body: 'Open investor office hours — I am hosting 30-minute slots every Friday this quarter for Cohort 7-10 founders raising pre-seed/seed. Bring your top 3 risks, not your deck. I have reviewed 46 decks this year and the pattern is clear: winners obsess over distribution, not product. Comment "office hours" and my team will reach out with the booking link.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-amara', 'u-zainab', 'u-fatima'],
    comments: [{ id: 'c-4', authorId: 'u-zainab', body: 'Office hours! ClinicConnect is raising a pre-seed for our tele-triage rollout in Kano.', createdAt: daysAgo(1) }],
    savedBy: ['u-amara'], createdAt: daysAgo(2), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-3', orgId: 'org-stp', authorId: 'u-fatima', postType: 'SOCIAL', category: 'Product',
    body: 'We shipped adaptive quizzes in Darija and Swahili this week. Early signal: completion rates up 34% vs the French-only control group. Localization is not a nice-to-have in Francophone Africa — it is the growth lever. Full experiment write-up coming to the Resource Library next month.',
    imageUrls: [IMAGES.collab[1]], videoUrl: null,
    likedBy: ['u-amara', 'u-david'], comments: [], savedBy: [], createdAt: daysAgo(3), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-4', orgId: 'org-stp', authorId: 'u-david', postType: 'SOCIAL', category: 'Operations',
    body: 'Cold-chain reality check: we moved 40 tons of tomatoes from northern Ghana to Accra with under 2% spoilage — down from 11% last quarter. The unlock was boring: route batching + co-op aggregation points. Happy to share the route-planning template with any founder fighting post-harvest loss.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-amara', 'u-ngozi'], comments: [{ id: 'c-5', authorId: 'u-ngozi', body: 'Would love this for LexAfrica food-sector clients. Sharing your post with two of them now.', createdAt: daysAgo(2) }],
    savedBy: [], createdAt: daysAgo(4), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-5', orgId: 'org-stp', authorId: 'u-chidi', postType: 'SOCIAL', category: 'Promotions',
    body: 'DOUBLE YOUR MONEY IN 30 DAYS GUARANTEED!! I have helped 200+ members of this network grow their savings with my exclusive crypto arbitrage system. Limited slots this week. WhatsApp me directly to lock in your position before the window closes!!! 🚀🚀🚀',
    imageUrls: [], videoUrl: null,
    likedBy: [], comments: [], savedBy: [],
    createdAt: daysAgo(5), status: 'REPORTED',
    reports: [
      { id: 'r-1', reason: 'SPAM', description: 'Financial scam soliciting WhatsApp contact — appears to target newer members.', reportedBy: 'u-zainab', createdAt: daysAgo(5) },
      { id: 'r-2', reason: 'INAPPROPRIATE', description: 'Guaranteed returns pitch is against community rules.', reportedBy: 'u-fatima', createdAt: daysAgo(4) },
    ],
  },
  {
    id: 'p-6', orgId: 'org-stp', authorId: 'u-ngozi', postType: 'SOCIAL', category: 'Legal',
    body: 'PSA for founders raising this quarter: your SAFE does not have to slow you down, but please stop signing founder-unfriendly liquidation preferences. I have seen three term sheets this month with 2x non-participating prefs on seed rounds. I am dropping a plain-English SAFE negotiation checklist into the Resource Library tonight.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-amara', 'u-kwame', 'u-zainab'], comments: [], savedBy: ['u-amara'], createdAt: daysAgo(6), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-7', orgId: 'org-stp', authorId: 'u-zainab', postType: 'SOCIAL', category: 'Hiring',
    body: 'ClinicConnect is hiring our founding product designer (remote, NG/EU timezones). You will own end-to-end tele-triage flows for patients who have never used a health app before. Design-for-low-literacy experience strongly preferred. Referrals from this network get first interviews.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-fatima'], comments: [{ id: 'c-6', authorId: 'u-fatima', body: 'Know two strong designers in Casablanca — connecting them now.', createdAt: daysAgo(3) }],
    savedBy: [], createdAt: daysAgo(7), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-8', orgId: 'org-stp', authorId: 'u-aisha', postType: 'SOCIAL', category: 'Marketing',
    body: 'First post as a verified member! I have spent 6 years building brands for FMCG companies and I am here to learn from operators. Also — admins, thank you for the fast verification turnaround.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-amara', 'u-admin-stp'], comments: [], savedBy: [], createdAt: daysAgo(2), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-9', orgId: 'org-stp', authorId: 'u-david', postType: 'SOCIAL', category: 'Feedback',
    body: 'Honest feedback about a supplier who keeps missing delivery windows — named and shamed with screenshots attached. Everyone should avoid this company completely.',
    imageUrls: [], videoUrl: null,
    likedBy: [], comments: [], savedBy: [],
    createdAt: daysAgo(1), status: 'HIDDEN',
    reports: [{ id: 'r-3', reason: 'HARASSMENT', description: 'Public naming with screenshots — seems defamatory and unverified.', reportedBy: 'u-kwame', createdAt: daysAgo(1) }],
  },
  {
    id: 'p-10', orgId: 'org-lbs', authorId: 'u-yetunde', postType: 'SOCIAL', category: 'Milestone',
    body: 'Adeyemi & Partners signed a transformation mandate with a leading regional bank this week. Grateful for the LBS referral that started this relationship back in 2019.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-bola', 'u-admin-lbs'], comments: [], savedBy: [], createdAt: daysAgo(2), status: 'ACTIVE', reports: [],
  },
  {
    id: 'p-11', orgId: 'org-inn', authorId: 'u-lara', postType: 'SOCIAL', category: 'Engineering',
    body: 'RafikiData processed 12 billion rows for logistics clients last month. Our entire ELT stack costs less than one enterprise license — the boring-tech advantage is real.',
    imageUrls: [], videoUrl: null,
    likedBy: ['u-sipho', 'u-admin-inn'], comments: [], savedBy: [], createdAt: daysAgo(1), status: 'ACTIVE', reports: [],
  },
];

// ---------------- Official News ----------------
const news: Database['news'] = [
  {
    id: 'n-1', orgId: 'org-stp', title: 'STP Network goes multi-tenant: any institution can now launch its own alumni workspace',
    category: 'Platform',
    content: 'We are excited to announce the biggest upgrade in the network\'s history. The STP Alumni Platform has evolved into a multi-tenant system: universities, corporate alumni programs, professional associations and accelerator communities can now provision their own branded workspace on the platform.\n\nEach organization gets its own logo, brand colors, member roster, feed, marketplace, events and administrators — while members enjoy the same familiar experience they know today. Organization administrators can customize terminology so the platform speaks their language: "Cohort" can become "Class Year", "Node" can become "Chapter".\n\nExisting STP members do not need to do anything — your account, connections and content carry over exactly as they are.',
    coverImage: IMAGES.campus[0], publishedAt: daysAgo(2), views: 1284, authorId: 'u-admin-stp', status: 'published',
  },
  {
    id: 'n-2', orgId: 'org-stp', title: 'Cohort 10 graduates join the network — welcome 84 new members',
    category: 'Community',
    content: 'This month we welcomed 84 graduates from Cohort 10, our largest intake ever. Members span 14 countries and 11 sectors, with Financial Services and Agriculture leading the pack.\n\nNew members: complete your profile setup to unlock the marketplace, connection suggestions and deal rooms. Existing members: watch your suggested connections — there are some exceptional operators in this cohort.',
    coverImage: IMAGES.campus[2], publishedAt: daysAgo(9), views: 2109, authorId: 'u-admin-stp', status: 'published',
  },
  {
    id: 'n-3', orgId: 'org-stp', title: 'Annual Alumni Summit 2026: registration now open',
    category: 'Events',
    content: 'Our flagship event returns to Lagos this year with three days of deal-making, masterclasses and sector deep-dives. Early-bird pricing is available to verified members for the first 200 registrations.\n\nThis year\'s program features a dedicated investor day, a founder-investor reverse pitch session, and the inaugural Alumni Marketplace Awards.',
    coverImage: IMAGES.events[5], publishedAt: daysAgo(15), views: 3211, authorId: 'u-admin-stp', status: 'published',
  },
  {
    id: 'n-4', orgId: 'org-stp', title: 'Deal Room governance update: mandatory NDA workflow',
    category: 'Platform',
    content: 'Following feedback from members active in co-investment rooms, all deal rooms now require a signed digital NDA before content becomes visible. Signatures are timestamped and recorded in each room\'s audit trail, and room owners can review member activity at any time.\n\nThis change applies retroactively to existing rooms — members who have not yet signed will see the NDA overlay on their next visit.',
    coverImage: IMAGES.meetings[4], publishedAt: daysAgo(21), views: 877, authorId: 'u-admin-stp', status: 'published',
  },
];

// ---------------- Connections ----------------
const connections: Database['connections'] = [
  { id: 'cn-1', orgId: 'org-stp', requesterId: 'u-amara', recipientId: 'u-david', status: 'ACCEPTED', createdAt: daysAgo(150), connectedSince: daysAgo(148) },
  { id: 'cn-2', orgId: 'org-stp', requesterId: 'u-fatima', recipientId: 'u-amara', status: 'ACCEPTED', createdAt: daysAgo(140), connectedSince: daysAgo(139) },
  { id: 'cn-3', orgId: 'org-stp', requesterId: 'u-amara', recipientId: 'u-kwame', status: 'ACCEPTED', createdAt: daysAgo(120), connectedSince: daysAgo(120) },
  { id: 'cn-4', orgId: 'org-stp', requesterId: 'u-ngozi', recipientId: 'u-amara', status: 'ACCEPTED', createdAt: daysAgo(100), connectedSince: daysAgo(99) },
  { id: 'cn-5', orgId: 'org-stp', requesterId: 'u-zainab', recipientId: 'u-amara', status: 'ACCEPTED', createdAt: daysAgo(80), connectedSince: daysAgo(79) },
  { id: 'cn-6', orgId: 'org-stp', requesterId: 'u-aisha', recipientId: 'u-amara', status: 'PENDING', createdAt: daysAgo(1) },
  { id: 'cn-7', orgId: 'org-stp', requesterId: 'u-david', recipientId: 'u-fatima', status: 'ACCEPTED', createdAt: daysAgo(90), connectedSince: daysAgo(88) },
  { id: 'cn-8', orgId: 'org-stp', requesterId: 'u-kwame', recipientId: 'u-zainab', status: 'ACCEPTED', createdAt: daysAgo(60), connectedSince: daysAgo(60) },
  { id: 'cn-9', orgId: 'org-stp', requesterId: 'u-amara', recipientId: 'u-zainab', status: 'PENDING', createdAt: daysAgo(2) },
  { id: 'cn-10', orgId: 'org-lbs', requesterId: 'u-yetunde', recipientId: 'u-bola', status: 'ACCEPTED', createdAt: daysAgo(200), connectedSince: daysAgo(198) },
  { id: 'cn-11', orgId: 'org-lbs', requesterId: 'u-yetunde', recipientId: 'u-emeka', status: 'ACCEPTED', createdAt: daysAgo(180), connectedSince: daysAgo(178) },
  { id: 'cn-12', orgId: 'org-inn', requesterId: 'u-lara', recipientId: 'u-sipho', status: 'ACCEPTED', createdAt: daysAgo(150), connectedSince: daysAgo(149) },
];

// ---------------- Groups ----------------
const groups: Database['groups'] = [
  {
    id: 'g-1', orgId: 'org-stp', name: 'Fintech Founders Circle', description: 'Operators and founders building financial products for African markets. We swap regulatory intel, payment rail deep-dives and warm intros to acquirers.',
    privacyMode: 'PUBLIC', status: 'ACTIVE',
    members: [
      { userId: 'u-amara', memberRole: 'ADMIN', joinedAt: daysAgo(120) },
      { userId: 'u-kwame', memberRole: 'MEMBER', joinedAt: daysAgo(118) },
      { userId: 'u-ngozi', memberRole: 'MEMBER', joinedAt: daysAgo(95) },
      { userId: 'u-zainab', memberRole: 'MEMBER', joinedAt: daysAgo(40) },
    ],
    coverImage: IMAGES.collab[3], createdBy: 'u-amara', createdAt: daysAgo(120),
    joinRequests: [{ id: 'jr-1', userId: 'u-aisha', createdAt: daysAgo(1) }],
    inviteToken: 'g-1-invite-token', likedBy: ['u-kwame', 'u-ngozi'], reportReason: null, reportedBy: null,
  },
  {
    id: 'g-2', orgId: 'org-stp', name: 'Agribusiness Innovators', description: 'From cold-chain logistics to agritech — members share route economics, co-op aggregation models and seasonal demand data.',
    privacyMode: 'PUBLIC', status: 'ACTIVE',
    members: [
      { userId: 'u-david', memberRole: 'ADMIN', joinedAt: daysAgo(110) },
      { userId: 'u-amara', memberRole: 'MEMBER', joinedAt: daysAgo(70) },
    ],
    coverImage: IMAGES.campus[1], createdBy: 'u-david', createdAt: daysAgo(110),
    joinRequests: [], inviteToken: 'g-2-invite-token', likedBy: [], reportReason: null, reportedBy: null,
  },
  {
    id: 'g-3', orgId: 'org-stp', name: 'Women Entrepreneurs Forum', description: 'A supportive space for women founders in the network — fundraising war-rooms, leadership clinics and quarterly meetups. Membership is approved by group admins.',
    privacyMode: 'CLOSED', status: 'ACTIVE',
    members: [
      { userId: 'u-zainab', memberRole: 'ADMIN', joinedAt: daysAgo(90) },
      { userId: 'u-fatima', memberRole: 'MEMBER', joinedAt: daysAgo(85) },
      { userId: 'u-amara', memberRole: 'MEMBER', joinedAt: daysAgo(60) },
    ],
    coverImage: IMAGES.meetings[2], createdBy: 'u-zainab', createdAt: daysAgo(90),
    joinRequests: [{ id: 'jr-2', userId: 'u-aisha', createdAt: daysAgo(2) }], inviteToken: 'g-3-invite-token',
    likedBy: [], reportReason: null, reportedBy: null,
  },
  {
    id: 'g-4', orgId: 'org-stp', name: 'Lagos Node', description: 'The official node group for Lagos-based alumni — monthly meetups, venue recommendations and local deal-flow sharing.',
    privacyMode: 'PUBLIC', status: 'ACTIVE',
    members: [
      { userId: 'u-amara', memberRole: 'MEMBER', joinedAt: daysAgo(100) },
      { userId: 'u-ngozi', memberRole: 'ADMIN', joinedAt: daysAgo(105) },
      { userId: 'u-zainab', memberRole: 'MEMBER', joinedAt: daysAgo(80) },
    ],
    coverImage: IMAGES.events[1], createdBy: 'u-ngozi', createdAt: daysAgo(105),
    joinRequests: [], inviteToken: 'g-4-invite-token', likedBy: [], reportReason: null, reportedBy: null,
  },
  {
    id: 'g-5', orgId: 'org-stp', name: 'Blockchain & Web3 Working Group', description: 'Proposed by a member: exploring stablecoin settlement rails for cross-border B2B trade. Awaiting admin approval.',
    privacyMode: 'PUBLIC', status: 'PENDING_APPROVAL',
    members: [{ userId: 'u-aisha', memberRole: 'ADMIN', joinedAt: daysAgo(3) }],
    coverImage: null, createdBy: 'u-aisha', createdAt: daysAgo(3), joinRequests: [], inviteToken: undefined,
    likedBy: [], reportReason: null, reportedBy: null,
  },
  {
    id: 'g-6', orgId: 'org-lbs', name: 'Real Estate Investment Circle', description: 'LBS members active in property development, REITs and affordable housing finance.',
    privacyMode: 'PUBLIC', status: 'ACTIVE',
    members: [
      { userId: 'u-emeka', memberRole: 'ADMIN', joinedAt: daysAgo(150) },
      { userId: 'u-yetunde', memberRole: 'MEMBER', joinedAt: daysAgo(140) },
    ],
    coverImage: IMAGES.campus[3], createdBy: 'u-emeka', createdAt: daysAgo(150),
    joinRequests: [], inviteToken: 'g-6-invite-token', likedBy: [], reportReason: null, reportedBy: null,
  },
];

// Group posts (scoped to groups)
const groupPosts: Database['posts'] = [
  {
    id: 'gp-1', orgId: 'org-stp', groupId: 'g-1', authorId: 'u-kwame', postType: 'SOCIAL', category: 'Deal Flow',
    body: 'Deal flow Friday: three fintech pre-seeds in my pipeline this week — a BNPL play for agricultural inputs, a stablecoin remittance corridor, and an insurtech for informal traders. Members of this circle get first look before I circulate wider. Comment or DM for the memo summaries.',
    imageUrls: [], videoUrl: null, likedBy: ['u-amara', 'u-ngozi'],
    comments: [{ id: 'gc-1', authorId: 'u-amara', body: 'Interested in the insurtech memo — tangential to PayLinx merchant credit.', createdAt: hoursAgo(30) }],
    savedBy: [], createdAt: daysAgo(2), status: 'ACTIVE', reports: [],
  },
  {
    id: 'gp-2', orgId: 'org-stp', groupId: 'g-1', authorId: 'u-ngozi', postType: 'SOCIAL', category: 'Regulatory',
    body: 'Central Bank of Nigeria issued new guidance on agent banking networks yesterday. Short version: tiered KYC for super-agents, stricter float limits. I am drafting a member brief — drop your questions below and I will address them in v1.',
    imageUrls: [], videoUrl: null, likedBy: ['u-amara', 'u-zainab'], comments: [], savedBy: [], createdAt: daysAgo(4), status: 'ACTIVE', reports: [],
  },
  {
    id: 'gp-3', orgId: 'org-stp', groupId: 'g-2', authorId: 'u-david', postType: 'SOCIAL', category: 'Logistics',
    body: 'Sharing our Q3 route economics dashboard (anonymized): Lagos-Kano corridor is now our most profitable lane at 92% truck utilization. Kano-Maiduguri still bleeding margin at 61%. Any members running that lane — let us compare notes.',
    imageUrls: [IMAGES.collab[2]], videoUrl: null,
    likedBy: ['u-amara'], comments: [], savedBy: [], createdAt: daysAgo(5), status: 'ACTIVE', reports: [],
  },
];

// ---------------- Events ----------------
const events: Database['events'] = [
  {
    id: 'e-1', orgId: 'org-stp', name: 'Fintech Founders Webinar: Surviving the Credit Downturn',
    description: 'A candid session with three founders who navigated credit portfolio stress in the last 12 months. We cover provisioning strategies, collections without brand damage, and when to pivot the credit product entirely. Live Q&A with our investor panel.',
    type: 'online', timeZone: 'Africa/Lagos', startTime: daysFromNow(6), endTime: daysFromNow(6),
    externalLink: 'https://meet.stp-network.org/fintech-webinar', address: undefined, venue: undefined,
    coverImage: IMAGES.meetings[0], createdBy: 'u-admin-stp',
    attendeeIds: ['u-amara', 'u-kwame', 'u-zainab'], waitlistIds: [], capacity: 200,
    status: 'ACTIVE', visibility: 'PUBLIC', createdAt: daysAgo(10),
  },
  {
    id: 'e-2', orgId: 'org-stp', name: 'Annual Alumni Summit 2026',
    description: 'Three days of deal-making, masterclasses and sector deep-dives. Dedicated investor day, founder-investor reverse pitch, and the Alumni Marketplace Awards gala. Early-bird pricing for the first 200 verified members.',
    type: 'in-person', timeZone: 'Africa/Lagos', startTime: daysFromNow(45), endTime: daysFromNow(47),
    externalLink: undefined, address: 'Victoria Island, Lagos, Nigeria', venue: 'Eko Convention Centre',
    coverImage: IMAGES.events[0], createdBy: 'u-admin-stp',
    attendeeIds: ['u-amara', 'u-david', 'u-fatima', 'u-kwame', 'u-ngozi', 'u-zainab'], waitlistIds: [], capacity: 600,
    status: 'ACTIVE', visibility: 'PUBLIC', createdAt: daysAgo(15),
  },
  {
    id: 'e-3', orgId: 'org-stp', name: 'Investor Office Hours with Sankofa Capital',
    description: 'One-on-one 30-minute sessions with Kwame Asante covering pre-seed and seed strategy. Bring your top 3 risks, not your deck. Sessions are assigned first-come; waitlist auto-promotes on cancellation.',
    type: 'online', timeZone: 'Africa/Accra', startTime: daysFromNow(3), endTime: daysFromNow(3),
    externalLink: 'https://meet.stp-network.org/office-hours', address: undefined, venue: undefined,
    coverImage: IMAGES.meetings[3], createdBy: 'u-kwame',
    attendeeIds: ['u-zainab'], waitlistIds: [], capacity: 8, status: 'ACTIVE', visibility: 'VERIFIED_ONLY', createdAt: daysAgo(4),
  },
  {
    id: 'e-4', orgId: 'org-stp', name: 'AgTech Field Tour — Kaduna Valley',
    description: 'Hands-on tour of two member-operated farms piloting drone crop intelligence and solar cold storage. Transport from Lagos included; limited to 25 members.',
    type: 'in-person', timeZone: 'Africa/Lagos', startTime: daysFromNow(14), endTime: daysFromNow(14),
    externalLink: undefined, address: 'Kaduna Valley, Kaduna, Nigeria', venue: 'Kaduna Valley Farms',
    coverImage: IMAGES.events[4], createdBy: 'u-david',
    attendeeIds: ['u-david', 'u-amara'], waitlistIds: ['u-fatima'], capacity: 25,
    status: 'ACTIVE', visibility: 'PUBLIC', createdAt: daysAgo(6),
  },
  {
    id: 'e-5', orgId: 'org-stp', name: 'Portfolio Founder Dinner (Private)',
    description: 'Intimate dinner for founders in Sankofa Capital\'s portfolio and selected co-investors. Chatham House rule. Proposed by a member — pending admin approval.',
    type: 'in-person', timeZone: 'Africa/Accra', startTime: daysFromNow(9), endTime: daysFromNow(9),
    externalLink: undefined, address: 'East Legon, Accra, Ghana', venue: 'Private Residence',
    coverImage: IMAGES.meetings[5], createdBy: 'u-kwame',
    attendeeIds: ['u-kwame'], waitlistIds: [], capacity: 14,
    status: 'PENDING_APPROVAL', visibility: 'INVITATION_ONLY', createdAt: daysAgo(1),
  },
  {
    id: 'e-6', orgId: 'org-stp', name: 'New Member Onboarding Session (Virtual)',
    description: 'Monthly orientation for newly verified members: how to use the marketplace, join deal rooms and make the most of connection suggestions. Recording shared with attendees.',
    type: 'online', timeZone: 'Africa/Lagos', startTime: hoursFromNow(30), endTime: hoursFromNow(31),
    externalLink: 'https://meet.stp-network.org/onboarding', address: undefined, venue: undefined,
    coverImage: IMAGES.meetings[1], createdBy: 'u-admin-stp',
    attendeeIds: [], waitlistIds: [], capacity: 100, status: 'ACTIVE', visibility: 'PUBLIC', createdAt: daysAgo(3),
  },
  {
    id: 'e-7', orgId: 'org-lbs', name: 'LBS Alumni Homecoming Gala',
    description: 'The flagship annual gathering of LBS alumni — leadership awards, chapter reports and the class-of-the-year dinner.',
    type: 'in-person', timeZone: 'Africa/Lagos', startTime: daysFromNow(20), endTime: daysFromNow(20),
    externalLink: undefined, address: 'Lekki, Lagos, Nigeria', venue: 'LBS Campus Auditorium',
    coverImage: IMAGES.events[2], createdBy: 'u-admin-lbs',
    attendeeIds: ['u-yetunde', 'u-bola', 'u-emeka'], waitlistIds: [], capacity: 400,
    status: 'ACTIVE', visibility: 'PUBLIC', createdAt: daysAgo(30),
  },
  {
    id: 'e-8', orgId: 'org-inn', name: 'InnovateHub Demo Day — Batch 9',
    description: 'Watch 24 accelerator teams pitch. Alumni investors get priority seating at the investor brunch.',
    type: 'hybrid', timeZone: 'Africa/Nairobi', startTime: daysFromNow(12), endTime: daysFromNow(12),
    externalLink: 'https://innovatehub.io/demoday', address: 'Westlands, Nairobi, Kenya', venue: 'InnovateHub HQ',
    coverImage: IMAGES.events[3], createdBy: 'u-admin-inn',
    attendeeIds: ['u-lara', 'u-sipho'], waitlistIds: [], capacity: 300,
    status: 'ACTIVE', visibility: 'PUBLIC', createdAt: daysAgo(12),
  },
];

// ---------------- Conversations ----------------
const conversations: Database['conversations'] = [
  {
    id: 'cv-1', orgId: 'org-stp', type: 'DIRECT', participantIds: ['u-amara', 'u-david'],
    createdBy: 'u-amara', createdAt: daysAgo(30), readBy: { ['u-amara']: 'm-5' },
    messages: [
      { id: 'm-1', conversationId: 'cv-1', senderId: 'u-david', content: 'Amara! Saw the merchant milestone post — huge congrats.', createdAt: daysAgo(2), status: 'read' },
      { id: 'm-2', conversationId: 'cv-1', senderId: 'u-amara', content: 'Thanks David. AgroLink was 40% of that growth — your co-op aggregation data changed our underwriting model.', createdAt: daysAgo(2), status: 'read' },
      { id: 'm-3', conversationId: 'cv-1', senderId: 'u-david', content: 'That is exactly why I wanted to talk. We are sitting on 14 months of supply-side transaction data the merchants do not monetize.', createdAt: daysAgo(1), status: 'read' },
      { id: 'm-4', conversationId: 'cv-1', senderId: 'u-amara', content: 'Interesting — a data JV could strengthen both credit models. Worth a room in the Deal Room with NDA coverage?', createdAt: hoursAgo(20), status: 'read' },
      { id: 'm-5', conversationId: 'cv-1', senderId: 'u-david', content: 'Yes. Let me draft scope and I will set it up. Also — are you speaking at the Summit? They asked me to recommend a fintech voice.', createdAt: hoursAgo(4), status: 'delivered' },
    ],
  },
  {
    id: 'cv-2', orgId: 'org-stp', type: 'DIRECT', participantIds: ['u-amara', 'u-fatima'],
    createdBy: 'u-fatima', createdAt: daysAgo(60), readBy: { ['u-amara']: 'm-9' },
    messages: [
      { id: 'm-6', conversationId: 'cv-2', senderId: 'u-fatima', content: 'The Darija quiz results are in — completion up 34%. Writing the experiment report this weekend.', createdAt: daysAgo(3), status: 'read' },
      { id: 'm-7', conversationId: 'cv-2', senderId: 'u-amara', content: 'Send it my way — want to cite it in our Series A narrative on localization moats.', createdAt: daysAgo(3), status: 'read' },
      { id: 'm-8', conversationId: 'cv-2', senderId: 'u-fatima', content: 'Will do. Also, two Casablanca designers replied to Zainab\'s hiring post — both look strong.', createdAt: daysAgo(2), status: 'read' },
      { id: 'm-9', conversationId: 'cv-2', senderId: 'u-amara', content: 'Forwarded them to Zainab directly. Community working as intended 🙂', createdAt: daysAgo(2), status: 'read' },
    ],
  },
  {
    id: 'cv-3', orgId: 'org-stp', type: 'GROUP', name: 'Summit Planning Committee',
    participantIds: ['u-amara', 'u-admin-stp', 'u-kwame', 'u-ngozi'],
    createdBy: 'u-admin-stp', createdAt: daysAgo(25), readBy: { ['u-amara']: 'm-13' },
    messages: [
      { id: 'm-10', conversationId: 'cv-3', senderId: 'u-admin-stp', content: 'Committee — investor day agenda draft v2 is up. We have 3 confirmed keynotes and 12 reverse-pitch slots.', createdAt: daysAgo(4), status: 'read' },
      { id: 'm-11', conversationId: 'cv-3', senderId: 'u-kwame', content: 'I can bring 5 funds to the investor brunch. Need the venue confirmation by Friday to lock travel.', createdAt: daysAgo(3), status: 'read' },
      { id: 'm-12', conversationId: 'cv-3', senderId: 'u-ngozi', content: 'Venue contract is signed — I will circulate the compliance summary tonight.', createdAt: daysAgo(3), status: 'read' },
      { id: 'm-13', conversationId: 'cv-3', senderId: 'u-admin-stp', content: 'Amara — can you anchor the fintech masterclass? 90 minutes, your format of choice.', createdAt: hoursAgo(26), status: 'delivered' },
    ],
  },
];

// ---------------- Deal Rooms ----------------
const dealRooms: Database['dealRooms'] = [
  {
    id: 'dr-1', orgId: 'org-stp', roomName: 'Series A Syndicate — PayLinx',
    roomDescription: 'Co-investment syndicate for PayLinx\'s Series A round. NDA applies. Financials and data room under "Documents".',
    createdBy: 'u-kwame', createdAt: daysAgo(12), isActive: true, status: 'ACTIVE',
    members: [
      { userId: 'u-kwame', ndaSigned: true, ndaSignedAt: daysAgo(12), role: 'OWNER', joinedAt: daysAgo(12) },
      { userId: 'u-amara', ndaSigned: true, ndaSignedAt: daysAgo(11), role: 'MEMBER', joinedAt: daysAgo(11) },
      { userId: 'u-ngozi', ndaSigned: false, ndaSignedAt: null, role: 'MEMBER', joinedAt: daysAgo(5) },
    ],
    messages: [
      { id: 'dm-1', senderId: 'u-kwame', content: 'Welcome Amara. The memo and draft terms are in Documents. We are targeting a $12M close with a 18-month runway to 1M merchants.', createdAt: daysAgo(11) },
      { id: 'dm-2', senderId: 'u-amara', content: 'Memo received. One correction on unit economics: our take rate steps up to 1.4% as volume tiers unlock — model update attached in Documents.', createdAt: daysAgo(10) },
      { id: 'dm-3', senderId: 'u-kwame', content: 'Updated the model — IRR now clears our hurdle at base case. Circulating to LP advisory board tomorrow.', createdAt: daysAgo(8) },
    ],
    files: [
      { id: 'df-1', name: 'PayLinx_SeriesA_Memo_v3.pdf', size: 2_400_000, uploadedBy: 'u-kwame', createdAt: daysAgo(11) },
      { id: 'df-2', name: 'Unit_Economics_Model_Q3.xlsx', size: 850_000, uploadedBy: 'u-amara', createdAt: daysAgo(10) },
      { id: 'df-3', name: 'Draft Term Sheet (redline).pdf', size: 1_100_000, uploadedBy: 'u-kwame', createdAt: daysAgo(8) },
    ],
    auditLog: [
      { id: 'al-1', action: 'Room created', performedBy: 'u-kwame', timestamp: daysAgo(12) },
      { id: 'al-2', action: 'Member added — Amara Okafor', performedBy: 'u-kwame', timestamp: daysAgo(11) },
      { id: 'al-3', action: 'NDA signed — Amara Okafor', performedBy: 'u-amara', timestamp: daysAgo(11) },
      { id: 'al-4', action: 'Document uploaded — Unit_Economics_Model_Q3.xlsx', performedBy: 'u-amara', timestamp: daysAgo(10) },
      { id: 'al-5', action: 'Member added — Ngozi Eze', performedBy: 'u-kwame', timestamp: daysAgo(5) },
    ],
  },
  {
    id: 'dr-2', orgId: 'org-stp', roomName: 'Agri-Fintech Data JV',
    roomDescription: 'Exploring a data joint venture between PayLinx and AgroLink Ghana — shared merchant + supply-side transaction data for credit underwriting.',
    createdBy: 'u-david', createdAt: daysAgo(2), isActive: true, status: 'ACTIVE',
    members: [
      { userId: 'u-david', ndaSigned: true, ndaSignedAt: daysAgo(2), role: 'OWNER', joinedAt: daysAgo(2) },
      { userId: 'u-amara', ndaSigned: false, ndaSignedAt: null, role: 'MEMBER', joinedAt: daysAgo(1) },
    ],
    messages: [
      { id: 'dm-4', senderId: 'u-david', content: 'Amara, room is live. I have uploaded the scope draft — 14 months of supply-side data, anonymized merchant IDs.', createdAt: daysAgo(1) },
    ],
    files: [
      { id: 'df-4', name: 'JV_Scope_Draft.docx', size: 320_000, uploadedBy: 'u-david', createdAt: daysAgo(1) },
    ],
    auditLog: [
      { id: 'al-6', action: 'Room created', performedBy: 'u-david', timestamp: daysAgo(2) },
      { id: 'al-7', action: 'NDA signed — David Mensah', performedBy: 'u-david', timestamp: daysAgo(2) },
      { id: 'al-8', action: 'Member added — Amara Okafor', performedBy: 'u-david', timestamp: daysAgo(1) },
    ],
  },
  {
    id: 'dr-3', orgId: 'org-stp', roomName: 'ClinicConnect Bridge Round',
    roomDescription: 'Pre-seed bridge for tele-triage rollout in Northern Nigeria. Member-submitted room pending admin approval.',
    createdBy: 'u-zainab', createdAt: hoursAgo(20), isActive: true, status: 'PENDING_APPROVAL',
    members: [{ userId: 'u-zainab', ndaSigned: true, ndaSignedAt: hoursAgo(20), role: 'OWNER', joinedAt: hoursAgo(20) }],
    messages: [], files: [],
    auditLog: [{ id: 'al-9', action: 'Room created', performedBy: 'u-zainab', timestamp: hoursAgo(20) }],
  },
];

// ---------------- Resources ----------------
const resources: Database['resources'] = [
  { id: 'res-1', orgId: 'org-stp', title: 'STP Founder Fundraising Playbook', description: 'End-to-end guide: narrative building, round sizing, investor targeting and term sheet negotiation. Compiled from 40+ member rounds.', category: 'guides', isVideo: false, fileType: 'PDF', downloads: 312, uploadedBy: 'u-admin-stp', visibility: 'ALL', status: 'ACTIVE', createdAt: daysAgo(90) },
  { id: 'res-2', orgId: 'org-stp', title: 'SAFE Negotiation Checklist', description: 'Ngozi\'s plain-English checklist of founder-unfriendly clauses to catch before signing. Updated for 2026 market norms.', category: 'templates', isVideo: false, fileType: 'DOCX', downloads: 198, uploadedBy: 'u-ngozi', visibility: 'VERIFIED', status: 'ACTIVE', createdAt: daysAgo(6) },
  { id: 'res-3', orgId: 'org-stp', title: 'Investor Pitch Masterclass (Recording)', description: '90-minute masterclass with three alumni VCs on what actually gets a second meeting. Includes the dreaded "why now" drill.', category: 'videos', isVideo: true, fileType: 'MP4', downloads: 87, uploadedBy: 'u-admin-stp', visibility: 'ALL', status: 'ACTIVE', createdAt: daysAgo(45) },
  { id: 'res-4', orgId: 'org-stp', title: 'Financial Model Template — Marketplace', description: 'Two-sided marketplace model with take-rate tiers, CAC/LTV tabs and cohort retention curves. Used by 3 funded members.', category: 'templates', isVideo: false, fileType: 'XLSX', downloads: 274, uploadedBy: 'u-admin-stp', visibility: 'ALL', status: 'ACTIVE', createdAt: daysAgo(120) },
  { id: 'res-5', orgId: 'org-stp', title: 'Community Guidelines & Moderation Policy', description: 'The rules of the road: content standards, report handling SLAs and the escalation path for disputes.', category: 'policies', isVideo: false, fileType: 'PDF', downloads: 66, uploadedBy: 'u-admin-stp', visibility: 'ALL', status: 'ACTIVE', createdAt: daysAgo(200) },
  { id: 'res-6', orgId: 'org-stp', title: 'Route Economics Dashboard Template', description: 'David\'s anonymized cold-chain lane profitability tracker — utilization, spoilage and margin per corridor.', category: 'sharedDocs', isVideo: false, fileType: 'XLSX', downloads: 41, uploadedBy: 'u-david', visibility: 'VERIFIED', status: 'ACTIVE', createdAt: daysAgo(5) },
  { id: 'res-7', orgId: 'org-stp', title: 'Onboarding Deck for New Members', description: 'How to get value in your first 30 days: marketplace setup, connection strategy and deal room etiquette.', category: 'trainingMaterials', isVideo: false, fileType: 'PDF', downloads: 520, uploadedBy: 'u-admin-stp', visibility: 'ALL', status: 'ACTIVE', createdAt: daysAgo(180) },
  { id: 'res-8', orgId: 'org-stp', title: 'Localization Experiment Write-up', description: 'Fatima\'s Darija/Swahili adaptive quiz experiment — methodology, results and replication guide. Pending admin review.', category: 'trainingMaterials', isVideo: false, fileType: 'PDF', downloads: 0, uploadedBy: 'u-fatima', visibility: 'ALL', status: 'PENDING', createdAt: daysAgo(2) },
  { id: 'res-9', orgId: 'org-lbs', title: 'Board Readiness Handbook', description: 'Preparing senior members for board service — governance essentials and committee dynamics.', category: 'guides', isVideo: false, fileType: 'PDF', downloads: 88, uploadedBy: 'u-admin-lbs', visibility: 'ALL', status: 'ACTIVE', createdAt: daysAgo(60) },
];

// ---------------- Notifications (for Amara) ----------------
const notifications: Database['notifications'] = [
  { id: 'nt-1', userId: 'u-amara', type: 'CONNECTION_REQUEST', title: 'New connection request', body: 'Aisha Bello wants to connect with you.', isRead: false, createdAt: daysAgo(1) },
  { id: 'nt-2', userId: 'u-amara', type: 'POST_LIKE', title: 'Your post is getting attention', body: 'Kwame Asante and 5 others liked your milestone post.', isRead: false, createdAt: hoursAgo(22) },
  { id: 'nt-3', userId: 'u-amara', type: 'POST_COMMENT', title: 'New comment on your post', body: 'Fatima Zahra commented: "Incredible trajectory..."', isRead: false, createdAt: hoursAgo(12) },
  { id: 'nt-4', userId: 'u-amara', type: 'SYSTEM_ANNOUNCEMENT', title: 'Platform is now multi-tenant', body: 'Your network now runs on the new multi-tenant platform. Read the official announcement.', isRead: true, createdAt: daysAgo(2) },
  { id: 'nt-5', userId: 'u-amara', type: 'EVENT_UPDATE', title: 'Annual Alumni Summit 2026', body: 'Registration is open — early-bird pricing for the first 200 verified members.', isRead: true, createdAt: daysAgo(15) },
  { id: 'nt-6', userId: 'u-admin-stp', type: 'SYSTEM_ANNOUNCEMENT', title: 'New member awaiting verification', body: 'Aisha Bello completed onboarding and awaits verification.', isRead: false, createdAt: daysAgo(2) },
  { id: 'nt-7', userId: 'u-admin-stp', type: 'SUPPORT_RESPONSE', title: 'New support ticket', body: '"Deal room NDA stuck" submitted by a member.', isRead: false, createdAt: daysAgo(1) },
];

// ---------------- Support Tickets ----------------
const supportTickets: Database['supportTickets'] = [
  { id: 'st-1', orgId: 'org-stp', userId: 'u-zainab', subject: 'Cannot sign NDA in deal room', message: 'The NDA overlay in "ClinicConnect Bridge Round" reloads every time I check the agreement box. Using Chrome on Android. Happy to hop on a call.', status: 'UNREAD', createdAt: daysAgo(1), reviewedAt: null },
  { id: 'st-2', orgId: 'org-stp', userId: 'u-david', subject: 'Marketplace profile not showing my new company', message: 'I updated my company name to AgroLink Ghana but the marketplace card still shows the old one. Cache issue?', status: 'READ', createdAt: daysAgo(3), reviewedAt: daysAgo(2) },
  { id: 'st-3', orgId: 'org-stp', userId: 'u-fatima', subject: 'Request: add Arabic to interface', message: 'Several Casablanca node members would love Arabic interface support in the settings preferences.', status: 'RESOLVED', createdAt: daysAgo(10), reviewedAt: daysAgo(8) },
  { id: 'st-4', orgId: 'org-lbs', userId: 'u-bola', subject: 'Chapter filter shows duplicate Abuja', message: 'The chapter filter in the directory lists Abuja twice — one empty. Minor but confusing.', status: 'UNREAD', createdAt: daysAgo(2), reviewedAt: null },
];

// ---------------- Security Logs ----------------
const securityLogs: Database['securityLogs'] = [
  { id: 'sl-1', eventType: 'LOGIN_SUCCESS', email: 'amara@stp.org', ipAddress: '102.89.34.12', orgId: 'org-stp', createdAt: minsAgo(12) },
  { id: 'sl-2', eventType: 'LOGIN_FAILED', email: 'unknown@stp.org', ipAddress: '41.203.88.7', orgId: 'org-stp', createdAt: hoursAgo(2) },
  { id: 'sl-3', eventType: 'LOGIN_FAILED', email: 'unknown@stp.org', ipAddress: '41.203.88.7', orgId: 'org-stp', createdAt: hoursAgo(2) },
  { id: 'sl-4', eventType: 'LOGIN_FAILED', email: 'admin@stp.org', ipAddress: '41.203.88.7', orgId: 'org-stp', createdAt: hoursAgo(1) },
  { id: 'sl-5', eventType: 'ACCOUNT_LOCKED', email: 'chidi@stp.org', ipAddress: '197.210.44.9', orgId: 'org-stp', createdAt: daysAgo(45) },
  { id: 'sl-6', eventType: 'PASSWORD_RESET_REQUEST', email: 'tunde@stp.org', ipAddress: '105.112.30.88', orgId: 'org-stp', createdAt: daysAgo(1) },
  { id: 'sl-7', eventType: 'PASSWORD_RESET_COMPLETED', email: 'tunde@stp.org', ipAddress: '105.112.30.88', orgId: 'org-stp', createdAt: daysAgo(1) },
  { id: 'sl-8', eventType: 'LOGIN_SUCCESS', email: 'admin@stp.org', ipAddress: '154.72.16.203', orgId: 'org-stp', createdAt: hoursAgo(5) },
  { id: 'sl-9', eventType: 'LOGIN_SUCCESS', email: 'super@unleashified.io', ipAddress: '154.72.16.203', orgId: null, createdAt: hoursAgo(3) },
  { id: 'sl-10', eventType: 'ROLE_CHANGED', email: 'grace@stp.org', ipAddress: '154.72.16.203', orgId: 'org-stp', createdAt: daysAgo(30) },
  { id: 'sl-11', eventType: 'LOGIN_SUCCESS', email: 'admin@lbs.edu', ipAddress: '197.149.3.55', orgId: 'org-lbs', createdAt: daysAgo(1) },
  { id: 'sl-12', eventType: 'LOGIN_FAILED', email: 'lara@innovatehub.io', ipAddress: '62.12.9.140', orgId: 'org-inn', createdAt: daysAgo(2) },
];

export const seedDatabase = (): Database => ({
  organizations,
  users,
  posts: [...posts, ...groupPosts],
  news,
  connections,
  groups,
  events,
  conversations,
  dealRooms,
  resources,
  notifications,
  supportTickets,
  securityLogs,
});
