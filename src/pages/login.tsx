import { Link, Navigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAppStore, viewToPath, defaultViewForRole } from '@/stores/useAppStore';
import { LoginView } from '@/components/auth/login-view';
import { LanguageSwitcher } from '@/components/landing/language-switcher';

// ============================================================
// /login — public route wrapping the (already built) login view
// with a way back to the landing page and a language switcher.
// ============================================================
export function LoginPage() {
  const session = useAppStore(s => s.session);
  if (session) {
    // Already authenticated — land on the role's default view
    return <Navigate to={viewToPath(defaultViewForRole(session.role))} replace />;
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Unleashified
        </Link>
        <div className="pointer-events-auto ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
      <LoginView />
    </div>
  );
}
