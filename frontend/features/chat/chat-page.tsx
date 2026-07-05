import { PlaceholderPage } from '@/features/shared/placeholder-page';

type ChatPageProps = {
  title: string;
};

export function ChatPage({ title }: ChatPageProps) {
  return <PlaceholderPage title={title} />;
}
