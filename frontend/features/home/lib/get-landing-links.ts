import type { LandingLinks } from '../types';

type GetLandingLinksOptions = {
  isAuthenticated: boolean;
};

export function getLandingLinks({
  isAuthenticated,
}: GetLandingLinksOptions): LandingLinks {
  if (isAuthenticated) {
    return {
      startShopping: '/listings',
      becomeSeller: '/listings',
      createAccount: '/dashboard',
      dashboard: '/dashboard',
    };
  }

  return {
    startShopping: '/login?next=/listings',
    becomeSeller: '/register',
    createAccount: '/register',
    dashboard: '/dashboard',
  };
}
