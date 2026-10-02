'use client';
// ============================================================
// Global app store — session, URL-backed navigation, UI state.
// Navigation is delegated to React Router via the nav bridge;
// the RouteSync component in app-root.tsx mirrors URL changes
// back into the store so browser back/forward and deep links
// keep working for every internal view.
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/lib/db/client';
import { navTo } from '@/lib/nav-bridge';

export interface RouteParams {
  [key: string]: string | undefined;
}

interface AppState {
  session: SessionUser | null;
  view: string;
  params: RouteParams;
  sidebarCollapsed: boolean;
  setSession: (s: SessionUser | null) => void;
  updateSession: (patch: Partial<SessionUser>) => void;
  navigate: (view: string, params?: RouteParams) => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export function defaultViewForRole(role?: string | null): string {
  if (role === 'SUPERADMIN') return 'platform-dashboard';
  if (role === 'ADMIN') return 'admin-dashboard';
  return 'dashboard';
}

/** Serialize an internal view + params into an /app URL. */
export function viewToPath(view: string, params?: RouteParams): string {
  let path = `/app/${view}`;
  if (params?.id) path += `/${params.id}`;
  const search = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'id' && v !== undefined) search.set(k, v);
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Parse an /app URL back into view + params. */
export function pathToView(pathname: string, search = ''): { view: string; params: RouteParams } {
  const parts = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean);
  const view = parts[0] || 'dashboard';
  const params: RouteParams = {};
  if (parts.length > 1) params.id = parts[1];
  if (search) {
    const sp = new URLSearchParams(search);
    sp.forEach((v, k) => {
      params[k] = v;
    });
  }
  return { view, params };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      view: 'dashboard',
      params: {},
      sidebarCollapsed: false,
      setSession: (session) => {
        const authed = !!session;
        const defaultView = defaultViewForRole(session?.role);
        set({ session, view: authed ? defaultView : 'login', params: {} });
        if (typeof window === 'undefined') return;
        if (authed) {
          // Entering the app from /login or / — jump to the role landing view
          if (!window.location.pathname.startsWith('/app')) navTo(viewToPath(defaultView));
        } else if (window.location.pathname.startsWith('/app')) {
          // Logging out from inside the app — return to the login screen
          navTo('/login');
        }
      },
      updateSession: (patch) =>
        set({ session: get().session ? { ...get().session!, ...patch } : null }),
      navigate: (view, params = {}) => {
        set({ view, params });
        navTo(viewToPath(view, params));
        if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
      },
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'unleashified_session_v1',
      partialize: (state) => ({ session: state.session, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
