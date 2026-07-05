import api from '@/lib/api';
import { clearCsrfToken, setCsrfToken, syncCsrfFromCookie } from '@/lib/csrf';
import type {
  AuthMessageResponse,
  AuthProfileResponse,
  AuthSessionResponse,
  LoginPayload,
  LogoutResponse,
  RegisterPayload,
  VerifyUserResponse,
} from '@/types/auth';

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

  async login(payload: LoginPayload): Promise<AuthSessionResponse> {
    const { data } = await api.post<AuthSessionResponse>(
      '/auth/login',
      payload,
    );
    return applySessionResponse(data);
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
};
