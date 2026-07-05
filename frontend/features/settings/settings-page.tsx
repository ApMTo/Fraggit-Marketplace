import { PlaceholderPage } from '@/features/shared/placeholder-page';

type SettingsPageProps = {
  title: string;
};

export function SettingsPage({ title }: SettingsPageProps) {
  return <PlaceholderPage title={title} />;
}
