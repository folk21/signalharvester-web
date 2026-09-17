import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, subscribeToUnauthorized } from '../../api/client';
import type { CurrentPrincipal, LoginRequest, UserRole } from '../../api/types';

const authQueryKey = ['auth', 'me'] as const;

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'error';

interface AuthSessionValue {
  status: AuthStatus;
  principal: CurrentPrincipal | null;
  error: unknown;
  loginError: unknown;
  logoutError: unknown;
  loginPending: boolean;
  logoutPending: boolean;
  login: (payload: LoginRequest) => Promise<CurrentPrincipal>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearLoginError: () => void;
  clearLogoutError: () => void;
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const principalQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: readCurrentPrincipal,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const clearApplicationQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
  }, [queryClient]);

  const endSession = useCallback(() => {
    clearApplicationQueries();
    queryClient.setQueryData<CurrentPrincipal | null>(authQueryKey, null);
  }, [clearApplicationQueries, queryClient]);

  useEffect(() => subscribeToUnauthorized(endSession), [endSession]);

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginRequest) => {
      await api.login(payload);
      return api.getCurrentPrincipal();
    },
    onSuccess: (principal) => {
      clearApplicationQueries();
      queryClient.setQueryData<CurrentPrincipal | null>(authQueryKey, principal);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: endSession,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        endSession();
      }
    },
  });

  const refresh = useCallback(async () => {
    await principalQuery.refetch();
  }, [principalQuery]);

  const value = useMemo<AuthSessionValue>(() => {
    const principal = principalQuery.data ?? null;
    const status: AuthStatus = principalQuery.isPending
      ? 'loading'
      : principalQuery.isError
        ? 'error'
        : principal
          ? 'authenticated'
          : 'anonymous';

    return {
      status,
      principal,
      error: principalQuery.error,
      loginError: loginMutation.error,
      logoutError: logoutMutation.error,
      loginPending: loginMutation.isPending,
      logoutPending: logoutMutation.isPending,
      login: loginMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      refresh,
      clearLoginError: loginMutation.reset,
      clearLogoutError: logoutMutation.reset,
    };
  }, [loginMutation, logoutMutation, principalQuery, refresh]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

async function readCurrentPrincipal(): Promise<CurrentPrincipal | null> {
  try {
    return await api.getCurrentPrincipal();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function useAuthSession(): AuthSessionValue {
  const session = useContext(AuthSessionContext);
  if (!session) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider');
  }
  return session;
}

export function hasRole(principal: CurrentPrincipal | null, role: UserRole): boolean {
  return principal?.roles.includes(role) ?? false;
}

export function defaultRouteForPrincipal(principal: CurrentPrincipal): string {
  if (hasRole(principal, 'ADMIN')) {
    return '/';
  }
  if (hasRole(principal, 'VIEWER')) {
    return '/results';
  }
  return '/';
}

export function canOpenOperationalResults(principal: CurrentPrincipal | null): boolean {
  return hasRole(principal, 'ADMIN') && hasRole(principal, 'VIEWER');
}

export function canAccessPath(principal: CurrentPrincipal, pathname: string): boolean {
  if (matchesRoute(pathname, '/results')) {
    return hasRole(principal, 'VIEWER');
  }

  if (
    pathname === '/'
    || matchesRoute(pathname, '/sources')
    || matchesRoute(pathname, '/profiles')
    || matchesRoute(pathname, '/runs')
    || matchesRoute(pathname, '/analysis')
    || matchesRoute(pathname, '/events')
    || matchesRoute(pathname, '/flows')
  ) {
    return hasRole(principal, 'ADMIN');
  }

  return false;
}

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}
