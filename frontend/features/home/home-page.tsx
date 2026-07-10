import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';

type HomePageProps = {
  subtitle: string;
  dashboardLabel: string;
  registerLabel: string;
  loginLabel: string;
  isAuthenticated: boolean;
};

export function HomePage({
  subtitle,
  dashboardLabel,
  registerLabel,
  loginLabel,
  isAuthenticated,
}: HomePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col px-5 py-16 sm:py-24">
      <div className="marketing-hero relative flex flex-col items-center gap-8 px-6 py-16 text-center sm:px-10 sm:py-20">
        <div className="relative z-10 space-y-4">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
            <span className="text-brand-gradient">Fraggit</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted">
            {subtitle}
          </p>
        </div>

        <div className="relative z-10">
          {isAuthenticated ? (
            <BrandButton href="/dashboard" size="lg">
              {dashboardLabel}
            </BrandButton>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <SecondaryButton href="/register" size="lg">
                {registerLabel}
              </SecondaryButton>
              <BrandButton href="/login" size="lg">
                {loginLabel}
              </BrandButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
