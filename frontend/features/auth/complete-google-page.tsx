'use client';

import { CompleteGoogleForm } from '@/components/auth/complete-google-form';

type CompleteGooglePageProps = {
  token: string;
};

export function CompleteGooglePage({ token }: CompleteGooglePageProps) {
  return <CompleteGoogleForm token={token} />;
}
