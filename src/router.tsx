import { createBrowserRouter, Navigate } from 'react-router';
import { LandingPage } from '@/pages/landing';
import { LoginPage } from '@/pages/login';
import { AppRoute } from '@/components/app/app-root';

// ============================================================
// React Router v8 — application routes
//   /        public marketing landing page (i18n, EN/FR/AR)
//   /login   sign-in / forgot / reset password
//   /app/*   authenticated member / admin / superadmin shell
// ============================================================
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/app', element: <AppRoute /> },
  { path: '/app/*', element: <AppRoute /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
