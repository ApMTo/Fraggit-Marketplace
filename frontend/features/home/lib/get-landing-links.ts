type LandingLinks = {
  startShopping: string;
  becomeSeller: string;
  createAccount: string;
  dashboard: string;
};

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
