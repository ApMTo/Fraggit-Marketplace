export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' | 'OWNER';

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
};

export type AuthSessionResponse = {
  accessToken: string;
  sessionToken: string;
  csrfToken: string;
};

export type AuthMessageResponse = {
  message: string;
};

export type AuthProfileResponse = {
  message: { code: string };
  user: AuthUser;
};

export type VerifyUserResponse = {
  message: string;
  user: AuthUser;
};

export type LogoutResponse = {
  message: { code: string };
};

export type RegisterPayload = {
  username: string;
  displayName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TwoFactorChallengeResponse = {
  requiresTwoFactor: true;
  challengeId: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
  message: { code: string };
};

export type LoginResponse = AuthSessionResponse | TwoFactorChallengeResponse;

export type VerifyTwoFactorPayload = {
  challengeId: string;
  code: string;
};

export type ResendTwoFactorPayload = {
  challengeId: string;
};

export type TwoFactorResendResponse = {
  message: { code: string };
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
};

export function isTwoFactorChallenge(
  response: LoginResponse,
): response is TwoFactorChallengeResponse {
  return (
    'requiresTwoFactor' in response && response.requiresTwoFactor === true
  );
}

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type ResetPasswordTokenResponse = {
  valid: boolean;
  expiresInSeconds: number;
};

export type CompleteGooglePayload = {
  token: string;
  username: string;
  displayName: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

export type GooglePendingResponse = {
  email: string;
  suggestedDisplayName: string;
  expiresInSeconds: number;
};

export type ApiErrorBody = {
  status: 'error';
  error: {
    message:
      | string
      | {
          code?: string;
          message?: string;
          error?: string;
          statusCode?: number;
          resendAvailableInSeconds?: number;
          restriction?: AccountRestriction;
        }
      | string[];
    code: number;
  };
};

export type AccountRestriction = {
  status: 'BANNED' | 'SUSPENDED';
  publicMessage: string | null;
  caseId: string | null;
  suspendedUntil: string | null;
};
