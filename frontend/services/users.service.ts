import api from '@/lib/api';
import type {
  UpdateProfilePayload,
  UserProfileResponse,
  UserPublicProfileResponse,
} from '@/types/user';

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  byUsername: (username: string) =>
    [...userKeys.all, 'username', username.toLowerCase()] as const,
};

function buildProfileFormData(payload: UpdateProfilePayload): FormData {
  const formData = new FormData();

  formData.append('username', payload.username);
  formData.append('displayName', payload.displayName);

  if (payload.bio !== undefined) {
    formData.append('bio', payload.bio ?? '');
  }

  if (payload.avatar instanceof File) {
    formData.append('avatar', payload.avatar);
  }

  return formData;
}

export const usersService = {
  async getMe(): Promise<UserProfileResponse> {
    const { data } = await api.get<UserProfileResponse>('/users/me');
    return data;
  },

  async getByUsername(username: string): Promise<UserPublicProfileResponse> {
    const { data } = await api.get<UserPublicProfileResponse>(
      `/users/${encodeURIComponent(username.toLowerCase())}`,
    );
    return data;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<UserProfileResponse> {
    const formData = buildProfileFormData(payload);
    const { data } = await api.patch<UserProfileResponse>(
      '/users/me',
      formData,
    );
    return data;
  },
};
