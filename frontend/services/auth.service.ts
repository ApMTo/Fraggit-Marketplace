import api from '@/lib/api';
import { clearCsrfToken, setCsrfToken, syncCsrfFromCookie } from '@/lib/csrf';
import type {
  AuthMessageResponse,
  AuthProfileResponse,
  AuthSessionResponse,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RegisterPayload,
  ResendTwoFactorPayload,
  ResetPasswordPayload,
  ResetPasswordTokenResponse,
  TwoFactorResendResponse,
  VerifyTwoFactorPayload,
  VerifyUserResponse,
} from '@/types/auth';
import { isTwoFactorChallenge } from '@/types/auth';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

function applySessionResponse(data: AuthSessionResponse): AuthSessionResponse {
  setCsrfToken(data.csrfToken);
  return data;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthMessageResponse> {
    const { data } = await api.post<AuthMessageResponse>(
      '/auth/register',
      payload,
    );
    return data;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    if (!isTwoFactorChallenge(data)) {
      return applySessionResponse(data);
    }
    return data;
  },

  async verifyTwoFactor(
    payload: VerifyTwoFactorPayload,
  ): Promise<AuthSessionResponse> {
    const { data } = await api.post<AuthSessionResponse>(
      '/auth/2fa/verify',
      payload,
    );
    return applySessionResponse(data);
  },

  async resendTwoFactor(
    payload: ResendTwoFactorPayload,
  ): Promise<TwoFactorResendResponse> {
    const { data } = await api.post<TwoFactorResendResponse>(
      '/auth/2fa/resend',
      payload,
    );
    return data;
  },

  async verify(token: string): Promise<VerifyUserResponse> {
    const { data } = await api.get<VerifyUserResponse>(
      `/auth/verify/${encodeURIComponent(token)}`,
    );
    syncCsrfFromCookie();
    return data;
  },

  async getMe(): Promise<AuthProfileResponse> {
    const { data } = await api.get<AuthProfileResponse>('/auth/me');
    return data;
  },

  async refresh(): Promise<AuthSessionResponse> {
    const { data } = await api.post<AuthSessionResponse>('/auth/refresh');
    return applySessionResponse(data);
  },

  async logout(): Promise<LogoutResponse> {
    const { data } = await api.post<LogoutResponse>('/auth/logout');
    clearCsrfToken();
    return data;
  },

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<AuthMessageResponse> {
    const { data } = await api.post<AuthMessageResponse>(
      '/auth/forgot-password',
      payload,
    );
    return data;
  },

  async validateResetToken(
    token: string,
  ): Promise<ResetPasswordTokenResponse> {
    const { data } = await api.get<ResetPasswordTokenResponse>(
      `/auth/reset-password/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<AuthMessageResponse> {
    const { data } = await api.post<AuthMessageResponse>(
      '/auth/reset-password',
      payload,
    );
    return data;
  },
};
