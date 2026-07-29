import api from '@/lib/api';
import type {
  ChangePasswordPayload,
  ChangeUsernamePayload,
  ConfirmEmailChangePayload,
  ConfirmTwoFactorEnablePayload,
  DisableTwoFactorPayload,
  EmailChangeRequestResponse,
  MessageResponse,
  RequestEmailChangePayload,
  TwoFactorCodeResponse,
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

  async requestEmailChange(
    payload: RequestEmailChangePayload,
  ): Promise<EmailChangeRequestResponse> {
    const { data } = await api.post<EmailChangeRequestResponse>(
      '/users/me/email/request',
      payload,
    );
    return data;
  },

  async confirmEmailChange(
    payload: ConfirmEmailChangePayload,
  ): Promise<UserProfileResponse> {
    const { data } = await api.post<UserProfileResponse>(
      '/users/me/email/confirm',
      payload,
    );
    return data;
  },

  async changeUsername(
    payload: ChangeUsernamePayload,
  ): Promise<UserProfileResponse> {
    const { data } = await api.post<UserProfileResponse>(
      '/users/me/username',
      payload,
    );
    return data;
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>(
      '/users/me/password',
      payload,
    );
    return data;
  },

  async requestTwoFactorEnable(): Promise<TwoFactorCodeResponse> {
    const { data } = await api.post<TwoFactorCodeResponse>(
      '/users/me/2fa/enable/request',
    );
    return data;
  },

  async confirmTwoFactorEnable(
    payload: ConfirmTwoFactorEnablePayload,
  ): Promise<UserProfileResponse> {
    const { data } = await api.post<UserProfileResponse>(
      '/users/me/2fa/enable/confirm',
      payload,
    );
    return data;
  },

  async disableTwoFactor(
    payload: DisableTwoFactorPayload,
  ): Promise<UserProfileResponse> {
    const { data } = await api.post<UserProfileResponse>(
      '/users/me/2fa/disable',
      payload,
    );
    return data;
  },
};
