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
      becomeSeller: '/listings/new',
      createAccount: '/listings',
    };
  }

  return {
    startShopping: '/listings',
    becomeSeller: '/register',
    createAccount: '/register',
  };
}
