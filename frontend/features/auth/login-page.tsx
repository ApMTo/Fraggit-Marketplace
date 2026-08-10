import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

type LoginPageProps = {
  redirectTo?: string;
};

export function LoginPage({ redirectTo = '/' }: LoginPageProps) {
  return (
    <Suspense fallback={null}>
      <LoginForm redirectTo={redirectTo} />
    </Suspense>
  );
}

