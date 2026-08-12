'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getLandingLinks } from '../lib/get-landing-links';
import { CtaSection } from './cta-section';

type CtaSectionWithAuthProps = {
  title: string;
  subtitle: string;
  startShoppingLabel: string;
  createAccountLabel: string;
};

export function CtaSectionWithAuth(props: CtaSectionWithAuthProps) {
  const { isAuthenticated } = useAuth();
  const links = getLandingLinks({ isAuthenticated });

  return <CtaSection {...props} links={links} />;
}
