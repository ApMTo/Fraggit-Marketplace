type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-6 px-5 py-10">
      <h1 className="page-title text-3xl">
        {title}
      </h1>
    </div>
  );
}
