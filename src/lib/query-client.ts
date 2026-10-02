import { QueryClient } from '@tanstack/react-query';

// ============================================================
// Shared QueryClient — mounted once in main.tsx so every route
// (login page included) can use react-query hooks.
// ============================================================
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});
