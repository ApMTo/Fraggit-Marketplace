type ProfileField = {
  label: string;
  value: string;
};

type ProfilePageProps = {
  title: string;
  fields: ProfileField[];
};

export function ProfilePage({ title, fields }: ProfilePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-10">
      <h1 className="page-title text-3xl">
        {title}
      </h1>

      <dl className="surface-card grid max-w-lg gap-5 p-6">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-sm text-subtle">{field.label}</dt>
            <dd className="mt-1 font-medium text-foreground">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
