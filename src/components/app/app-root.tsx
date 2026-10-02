'use client';
// ============================================================
// AppRoute — the authenticated area mounted at /app/*.
// Gates unauthenticated visitors to /login, renders the authed
// shell (forced password change → onboarding wizard → app) and
// keeps the store's view state synchronized with the URL so
// browser back/forward and deep links work everywhere.
// ============================================================
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAppStore, pathToView } from '@/stores/useAppStore';
import { AppProvider, useApp } from '@/components/app/app-context';
import { AppShell } from '@/components/app/app-shell';
import { ViewRouter } from '@/components/app/view-router';
import { PasswordChangeOverlay } from '@/components/auth/password-change-overlay';
import { ProfileSetupWizard } from '@/components/auth/profile-setup-wizard';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#14224A] via-[#1B2F5B] to-[#233389]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white backdrop-blur">
          UA
        </div>
        <p className="text-sm font-medium text-white/70">Unleashified Alumni Platform</p>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#FBAD17]" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors URL changes (back/forward, deep links) into the store. */
function RouteSync() {
  const location = useLocation();
  useEffect(() => {
    const { view, params } = pathToView(location.pathname, location.search);
    const state = useAppStore.getState();
    if (!state.session) return;
    const same =
      state.view === view &&
      Object.keys(state.params).length === Object.keys(params).length &&
      Object.entries(params).every(([k, v]) => state.params[k] === v);
    if (!same) useAppStore.setState({ view, params });
  }, [location]);
  return null;
}

export function AppRoute() {
  const session = useAppStore(s => s.session);

  if (!session) return <Navigate to="/login" replace />;

  return (
    <AppProvider userId={session.userId}>
      <RouteSync />
      <AuthedApp />
    </AppProvider>
  );
}

function AuthedApp() {
  const { user, userLoading } = useApp();
  const session = useAppStore(s => s.session);

  if (userLoading || (!user && session)) {
    return <Splash />;
  }

  // Flow: temp password → forced change; then onboarding wizard; then the app shell
  if (session?.passwordChangeRequired) {
    return <PasswordChangeOverlay />;
  }
  if (!user) return <Splash />;
  if (!user.isOnboarded && user.role !== 'SUPERADMIN') {
    return <ProfileSetupWizard />;
  }

  return (
    <AppShell>
      <ViewRouter />
    </AppShell>
  );
}
