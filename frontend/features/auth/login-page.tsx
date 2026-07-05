import { LoginForm } from '@/components/auth/login-form';

type LoginPageProps = {
  redirectTo?: string;
};

export function LoginPage({ redirectTo = '/dashboard' }: LoginPageProps) {
  return <LoginForm redirectTo={redirectTo} />;
}
