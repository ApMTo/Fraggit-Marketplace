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
import { onSessionInvalidated } from '@/lib/auth-session';
import { clearClientAuthCookies, hasSessionCookie } from '@/lib/cookies';
import { clearCsrfToken, syncCsrfFromCookie } from '@/lib/csrf';
import { authKeys, authService } from '@/services/auth.service';
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  VerifyTwoFactorPayload,
} from '@/types/auth';
import { isTwoFactorChallenge } from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  verifyTwoFactor: (payload: VerifyTwoFactorPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser: AuthUser | null;
  initialSessionActive?: boolean;
};

function toProfileCache(user: AuthUser) {
  return {
    user,
    message: { code: 'messages.profile_data' },
  };
}

export function AuthProvider({
  children,
  initialUser,
  initialSessionActive = false,
}: AuthProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sessionActive, setSessionActive] = useState(
    () =>
      Boolean(initialUser) ||
      initialSessionActive ||
      hasSessionCookie(),
  );
  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);
  const [prevInitialSessionActive, setPrevInitialSessionActive] =
    useState(initialSessionActive);

  const stopSessionQuery = useCallback(async () => {
    await queryClient.cancelQueries({ queryKey: authKeys.me() });
    queryClient.removeQueries({ queryKey: authKeys.me() });
  }, [queryClient]);

  const handleSessionInvalidated = useCallback(async () => {
    clearCsrfToken();
    clearClientAuthCookies();
    setSessionActive(false);
    await stopSessionQuery();
    router.push('/login');
    router.refresh();
  }, [router, stopSessionQuery]);

  useEffect(() => {
    return onSessionInvalidated(handleSessionInvalidated);
  }, [handleSessionInvalidated]);

  if (
    initialUser !== prevInitialUser ||
    initialSessionActive !== prevInitialSessionActive
  ) {
    setPrevInitialUser(initialUser);
    setPrevInitialSessionActive(initialSessionActive);
    setSessionActive(
      Boolean(initialUser) || initialSessionActive || hasSessionCookie(),
    );
  }

  const { data: profile, isPending, isFetching } = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      syncCsrfFromCookie();
      return authService.getMe();
    },
    initialData: initialUser ? toProfileCache(initialUser) : undefined,
    enabled: sessionActive,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: sessionActive && !initialUser,
  });

  const user = profile?.user ?? initialUser ?? null;
  const isLoading = sessionActive && !user && (isPending || isFetching);

  const updateUser = useCallback(
    (nextUser: AuthUser) => {
      setSessionActive(true);
      queryClient.setQueryData(authKeys.me(), toProfileCache(nextUser));
    },
    [queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: authService.login,
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: authService.verifyTwoFactor,
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: async () => {
      clearCsrfToken();
      clearClientAuthCookies();
      setSessionActive(false);
      await stopSessionQuery();
    },
  });

  const establishSession = useCallback(async () => {
    syncCsrfFromCookie();
    setSessionActive(true);
    const profileData = await authService.getMe();
    queryClient.setQueryData(authKeys.me(), profileData);
    return profileData.user;
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginMutation.mutateAsync(payload);
      if (isTwoFactorChallenge(result)) {
        return result;
      }
      await establishSession();
      return result;
    },
    [loginMutation, establishSession],
  );

  const verifyTwoFactor = useCallback(
    async (payload: VerifyTwoFactorPayload) => {
      await verifyTwoFactorMutation.mutateAsync(payload);
      return establishSession();
    },
    [verifyTwoFactorMutation, establishSession],
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
      clearClientAuthCookies();
      setSessionActive(false);
      await stopSessionQuery();
      try {
        await authService.clearSession();
      } catch {
        // Best-effort wipe of httpOnly cookies when logout itself fails.
      }
    } finally {
      router.push('/login');
      router.refresh();
    }
  }, [logoutMutation, router, stopSessionQuery]);

  const refreshUser = useCallback(async () => {
    if (!hasSessionCookie()) {
      setSessionActive(false);
      queryClient.setQueryData(authKeys.me(), null);
      return;
    }

    setSessionActive(true);
    await queryClient.invalidateQueries({ queryKey: authKeys.me() });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      verifyTwoFactor,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [
      user,
      isLoading,
      login,
      verifyTwoFactor,
      register,
      logout,
      refreshUser,
      updateUser,
    ],
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
