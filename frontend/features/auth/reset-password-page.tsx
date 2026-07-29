import { ResetPasswordForm } from '@/components/auth/reset-password-form';

type ResetPasswordPageProps = {
  token: string;
};

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  return <ResetPasswordForm token={token} />;
}
