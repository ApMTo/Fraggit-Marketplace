type DashboardPageProps = {
  title: string;
  displayName: string;
  username: string;
};

export function DashboardPage({
  title,
  displayName,
  username,
}: DashboardPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-muted">
          {displayName}{' '}
          <span className="text-subtle">@{username}</span>
        </p>
      </div>
    </div>
  );
}
