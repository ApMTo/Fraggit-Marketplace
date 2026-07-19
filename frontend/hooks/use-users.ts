'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { clearCsrfToken, syncCsrfFromCookie } from '@/lib/csrf';
import { listingKeys } from '@/services/listings.service';
import { userKeys, usersService } from '@/services/users.service';
import type { AuthUser } from '@/types/auth';
import type {
  ChangePasswordPayload,
  ChangeUsernamePayload,
  ConfirmEmailChangePayload,
  RequestEmailChangePayload,
  UpdateProfilePayload,
  UserProfile,
  UserPublicProfile,
  UserPublicProfileResponse,
} from '@/types/user';

function toAuthUser(profile: UserProfile): AuthUser {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    email: profile.email,
    role: profile.role,
  };
}

function toPublicProfile(profile: UserProfile): UserPublicProfile {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    rating: profile.rating,
    ratingCount: profile.ratingCount,
    successfulSales: profile.successfulSales,
    createdAt: profile.createdAt,
  };
}

function resyncCsrfAfterSessionReissue() {
  clearCsrfToken();
  syncCsrfFromCookie();
}

function syncProfileCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  data: UserProfileResponseLike,
  previousUsername: string | undefined,
  updateUser: (user: AuthUser) => void,
) {
  queryClient.setQueryData(userKeys.me(), data);

  const nextUsername = data.user.username;

  queryClient.setQueryData(userKeys.byUsername(nextUsername), {
    message: data.message,
    user: toPublicProfile(data.user),
  } satisfies UserPublicProfileResponse);

  if (
    previousUsername &&
    previousUsername.toLowerCase() !== nextUsername.toLowerCase()
  ) {
    queryClient.removeQueries({
      queryKey: userKeys.byUsername(previousUsername),
    });
  }

  updateUser(toAuthUser(data.user));
  void queryClient.invalidateQueries({
    queryKey: listingKeys.sellerLists(),
  });
}

type UserProfileResponseLike = {
  message: { code: string };
  user: UserProfile;
};

export function useUserProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => usersService.getMe(),
    staleTime: 60_000,
    select: (data) => data.user,
    enabled: options?.enabled ?? true,
  });
}

export function usePublicUser(
  username: string,
  options?: { enabled?: boolean },
) {
  const normalized = username.trim().toLowerCase();

  return useQuery({
    queryKey: userKeys.byUsername(normalized),
    queryFn: () => usersService.getByUsername(normalized),
    staleTime: 60_000,
    select: (data) => data.user,
    enabled: (options?.enabled ?? true) && normalized.length > 0,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      usersService.updateMe(payload),
    onSuccess: (data) => {
      syncProfileCaches(queryClient, data, user?.username, updateUser);
    },
  });
}

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: (payload: RequestEmailChangePayload) =>
      usersService.requestEmailChange(payload),
  });
}

export function useConfirmEmailChange() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();

  return useMutation({
    mutationFn: (payload: ConfirmEmailChangePayload) =>
      usersService.confirmEmailChange(payload),
    onSuccess: (data) => {
      resyncCsrfAfterSessionReissue();
      syncProfileCaches(queryClient, data, user?.username, updateUser);
    },
  });
}

export function useChangeUsername() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();

  return useMutation({
    mutationFn: (payload: ChangeUsernamePayload) =>
      usersService.changeUsername(payload),
    onSuccess: (data) => {
      syncProfileCaches(queryClient, data, user?.username, updateUser);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      usersService.changePassword(payload),
    onSuccess: () => {
      resyncCsrfAfterSessionReissue();
    },
  });
}
