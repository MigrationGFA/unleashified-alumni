// ============================================================
// Internet image assets (OSS-hosted URLs fetched via image
// search) — used across the landing page and the mock DB seed.
// Swap for real uploads when the backend arrives.
// ============================================================

const CDN = 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt';

/** Landing page imagery */
export const IMAGES = {
  /** Hero background — professionals networking at a conference (2560x1425) */
  hero: `${CDN}/e740c75103cd.jpg`,
  /** Professional section, row 1 — mentorship meeting (2560x1384) */
  professionalNetwork: `${CDN}/2e0f7c64626a.jpg`,
  /** Professional section, row 2 — workshop / training session (1920x1080) */
  professionalGrowth: `${CDN}/f0ab13378081.jpg`,
  /** Professional section, row 3 — partnership handshake (1125x750) */
  professionalOpportunities: `${CDN}/75a88cc5ba39.jpeg`,
  /** Event cover photos (alumni reunions / gatherings) */
  events: [
    `${CDN}/6957d4db5537.jpg`, // 3200x1800 reunion crowd
    `${CDN}/0e88a09a0650.jpg`, // 1600x900 campus event
    `${CDN}/9793b9d5d8bf.jpg`, // 1280x853 networking session
    `${CDN}/fd0ca13e0b54.jpg`, // 1164x1490 portrait gathering
    `${CDN}/5c2f27584f36.jpg`, // 1038x768 campus crowd
    `${CDN}/2bc562b34385.jpeg`, // 1800x1200 celebration
  ],
  /** Campus / institutional imagery (news + group covers) */
  campus: [
    `${CDN}/a4150ccddc5e.jpg`, // 2000x800 wide campus banner
    `${CDN}/1b607a12bd37.jpg`, // 1200x800 building
    `${CDN}/3fc1470f11c9.jpg`, // 1440x960 Princeton-style campus
    `${CDN}/6742b58f691e.jpg`, // 1920x1818 modern building
  ],
  /** Collaboration / startup workspace imagery (posts + groups) */
  collab: [
    `${CDN}/9d7b4df64e18.jpg`, // 3000x1688 team at work
    `${CDN}/0f521a6a6c6e.jpeg`, // 1216x832 learning session
    `${CDN}/80e33512ef08.jpg`, // 3000x2000 collaboration
    `${CDN}/b2b217f6863c.jpg`, // 5366x3577 workspace
  ],
  /** Meetings / office imagery (event covers) */
  meetings: [
    `${CDN}/6208dd028eef.jpg`, // 1300x775 workshop
    `${CDN}/77b50ea2013a.jpg`, // 1300x1009 training
    `${CDN}/5fafdd012e73.png`, // 1606x1056 mentorship
    `${CDN}/ebdcd663275d.jpeg`, // 1376x768 meeting
    `${CDN}/bb037df56879.jpg`, // 1600x1157 handshake
    `${CDN}/c3b3744ab4b6.jpg`, // 1600x1157 deal
  ],
} as const;

const PORTRAIT = (gender: 'men' | 'women', n: number) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

/** Seeded member avatars keyed by user id */
export const AVATARS: Record<string, string> = {
  'u-super': PORTRAIT('women', 44),
  'u-admin-stp': PORTRAIT('women', 68),
  'u-amara': PORTRAIT('women', 12),
  'u-david': PORTRAIT('men', 32),
  'u-fatima': PORTRAIT('women', 26),
  'u-kwame': PORTRAIT('men', 85),
  'u-ngozi': PORTRAIT('women', 17),
  'u-zainab': PORTRAIT('women', 33),
  'u-aisha': PORTRAIT('women', 21),
  'u-chidi': PORTRAIT('men', 11),
  'u-tunde': PORTRAIT('men', 76),
  'u-admin-lbs': PORTRAIT('men', 41),
  'u-yetunde': PORTRAIT('women', 57),
  'u-bola': PORTRAIT('women', 8),
  'u-emeka': PORTRAIT('men', 15),
  'u-admin-inn': PORTRAIT('women', 31),
  'u-lara': PORTRAIT('women', 49),
  'u-sipho': PORTRAIT('men', 22),
};
