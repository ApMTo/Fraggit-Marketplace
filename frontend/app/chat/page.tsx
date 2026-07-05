import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChatPage } from '@/features/chat/chat-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('chat')} | Fraggit`,
  };
}

export default async function Page() {
  const t = await getTranslations('pages');

  return <ChatPage title={t('chat')} />;
}
