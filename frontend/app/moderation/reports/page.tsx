import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireModeratorUser } from '@/lib/auth.server';

export const metadata: Metadata = {
  title: 'Reports | Fraggit',
};

export default async function Page() {
  await requireModeratorUser();
  redirect('/moderation/reports/lots');
}
