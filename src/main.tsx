import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import '@/i18n';
import '@/globals.css';
import { Toaster } from '@/components/ui/sonner';
import { router } from '@/router';
import { setRouterNavigate } from '@/lib/nav-bridge';
import { queryClient } from '@/lib/query-client';

// Wire the zustand store's navigate() to the React Router instance
setRouterNavigate((to, opts) => router.navigate(to, opts));

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster position="bottom-right" richColors closeButton />
  </QueryClientProvider>
);
