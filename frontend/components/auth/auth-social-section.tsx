'use client';

import { AuthDivider } from '@/components/auth/auth-divider';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';

type AuthSocialSectionProps = {
  googleLabel: string;
  dividerLabel: string;
};

export function AuthSocialSection({
  googleLabel,
  dividerLabel,
}: AuthSocialSectionProps) {
  return (
    <div className="flex flex-col gap-[1.15rem]">
      <GoogleAuthButton label={googleLabel} />
      <AuthDivider label={dividerLabel} />
    </div>
  );
}
