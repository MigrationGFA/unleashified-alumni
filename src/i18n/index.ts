// ============================================================
// i18n — react-i18next setup with the same three locales as the
// original alumni app (English / Français / العربية), persisted
// language choice and RTL support for Arabic.
// ============================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const;

export type LocaleCode = (typeof LANGUAGES)[number]['code'];
const SUPPORTED = LANGUAGES.map(l => l.code) as readonly string[];
const STORAGE_KEY = 'unleashified_locale';

function detectInitialLocale(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(nav)) return nav;
  } catch {
    /* storage unavailable */
  }
  return 'en';
}

function applyDocumentLocale(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: detectInitialLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
});

i18n.on('languageChanged', lng => {
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  applyDocumentLocale(lng);
});

applyDocumentLocale(i18n.language);

export default i18n;
