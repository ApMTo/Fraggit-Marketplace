'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getLandingLinks } from '../lib/get-landing-links';
import { HeroSection } from './hero-section';

type HeroSectionWithAuthProps = {
  title: string;
  subtitle: string;
  startShoppingLabel: string;
  becomeSellerLabel: string;
};

export function HeroSectionWithAuth(props: HeroSectionWithAuthProps) {
  const { isAuthenticated } = useAuth();
  const links = getLandingLinks({ isAuthenticated });

  return <HeroSection {...props} links={links} />;
}
