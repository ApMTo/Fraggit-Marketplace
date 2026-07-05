import { VerifyEmailForm } from '@/components/auth/verify-email-form';

type VerifyEmailPageProps = {
  token: string;
};

export function VerifyEmailPage({ token }: VerifyEmailPageProps) {
  return <VerifyEmailForm token={token} />;
}
