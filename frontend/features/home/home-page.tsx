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
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-4 py-24 text-center sm:px-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          <span className="text-brand-gradient">Fraggit</span>
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-muted">
          {subtitle}
        </p>
      </div>

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
  );
}
