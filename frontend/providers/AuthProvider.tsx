'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { hasSessionCookie } from '@/lib/cookies';
import { clearCsrfToken, syncCsrfFromCookie } from '@/lib/csrf';
import { authKeys, authService } from '@/services/auth.service';
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser: AuthUser | null;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sessionActive, setSessionActive] = useState(
    () => Boolean(initialUser) || hasSessionCookie(),
  );

  useEffect(() => {
    setSessionActive(hasSessionCookie());
  }, [initialUser]);

  const { data: profile, isPending, isFetching } = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      syncCsrfFromCookie();
      return authService.getMe();
    },
    initialData: initialUser
      ? { user: initialUser, message: { code: 'messages.profile_data' } }
      : undefined,
    enabled: sessionActive,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: sessionActive && !initialUser,
  });

  const user = profile?.user ?? initialUser ?? null;
  const isLoading = sessionActive && !user && (isPending || isFetching);

  const setAuthenticatedUser = useCallback(
    async (nextUser: AuthUser) => {
      setSessionActive(true);
      queryClient.setQueryData(authKeys.me(), {
        user: nextUser,
        message: { code: 'messages.profile_data' },
      });
    },
    [queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      syncCsrfFromCookie();
      setSessionActive(true);
      const profileData = await authService.getMe();
      queryClient.setQueryData(authKeys.me(), profileData);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: async () => {
      clearCsrfToken();
      setSessionActive(false);
      queryClient.setQueryData(authKeys.me(), null);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  const login = useCallback(
    async (payload: LoginPayload) => {
      await loginMutation.mutateAsync(payload);
      syncCsrfFromCookie();
      const profileData = await authService.getMe();
      await setAuthenticatedUser(profileData.user);
      return profileData.user;
    },
    [loginMutation, setAuthenticatedUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerMutation.mutateAsync(payload);
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      clearCsrfToken();
      setSessionActive(false);
      queryClient.setQueryData(authKeys.me(), null);
    } finally {
      router.push('/login');
      router.refresh();
    }
  }, [logoutMutation, queryClient, router]);

  const refreshUser = useCallback(async () => {
    setSessionActive(hasSessionCookie());
    await queryClient.invalidateQueries({ queryKey: authKeys.me() });
    router.refresh();
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
