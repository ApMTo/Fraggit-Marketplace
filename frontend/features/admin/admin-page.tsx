import { PlaceholderPage } from '@/features/shared/placeholder-page';

type AdminPageProps = {
  title: string;
};

export function AdminPage({ title }: AdminPageProps) {
  return <PlaceholderPage title={title} />;
}
