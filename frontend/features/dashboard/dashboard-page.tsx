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
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-10">
      <div className="space-y-1">
        <h1 className="page-title text-3xl">
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
