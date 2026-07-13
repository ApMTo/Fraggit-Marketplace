import { redirect } from 'next/navigation';
import { requireSessionUser } from '@/lib/auth.server';

export default async function Page() {
  const user = await requireSessionUser();
  redirect(`/user/${user.username}`);
}
