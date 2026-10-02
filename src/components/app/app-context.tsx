'use client';

// ============================================================
// App context — current user + organization + terminology
// ============================================================
import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orgsApi, usersApi } from '@/lib/db/client';
import type { Organization, User, OrgTerminology } from '@/lib/db/types';

export type TerminologyKey = keyof OrgTerminology;

interface AppContextValue {
  user: User | null;
  userLoading: boolean;
  org: Organization | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Resolve community-specific terminology (cohort/node/member/community) */
  t: (key: TerminologyKey) => string;
  refetchUser: () => void;
  refetchOrg: () => void;
}

const AppContext = createContext<AppContextValue>({
  user: null, userLoading: true, org: null, isAdmin: false, isSuperAdmin: false,
  t: (k) => DEFAULT_TERMINOLOGY[k], refetchUser: () => {}, refetchOrg: () => {},
});

const DEFAULT_TERMINOLOGY: OrgTerminology = { cohort: 'Cohort', node: 'Node', member: 'Alumni', community: 'Network' };

export function AppProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const userQuery = useQuery({
    queryKey: ['me', userId],
    queryFn: () => usersApi.get(userId),
    staleTime: 30_000,
  });

  const orgId = userQuery.data?.orgId ?? null;
  const orgQuery = useQuery({
    queryKey: ['org', orgId],
    queryFn: () => (orgId ? orgsApi.get(orgId) : Promise.resolve(null)),
    enabled: orgId !== undefined,
    staleTime: 30_000,
  });

  const user = userQuery.data ?? null;
  const org = orgQuery.data ?? null;
  const terminology = org?.terminology ?? DEFAULT_TERMINOLOGY;

  const value: AppContextValue = {
    user,
    userLoading: userQuery.isLoading,
    org,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPERADMIN',
    isSuperAdmin: user?.role === 'SUPERADMIN',
    t: (key) => terminology[key],
    refetchUser: () => userQuery.refetch(),
    refetchOrg: () => orgQuery.refetch(),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
