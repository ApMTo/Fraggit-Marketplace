import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChatPage } from '@/features/chat/chat-page';

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const t = await getTranslations('pages');
  await params;

  return {
    title: `${t('chat')} | Fraggit`,
  };
}

export default async function Page({ params }: PageProps) {
  const t = await getTranslations('pages');
  const { conversationId } = await params;

  return (
    <ChatPage title={t('chat')} conversationId={conversationId} />
  );
}
