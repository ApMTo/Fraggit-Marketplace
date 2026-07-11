import { CategoriesAdminPage } from '@/features/admin/categories-admin-page';

type AdminPageProps = {
  title: string;
};

export function AdminPage({ title }: AdminPageProps) {
  return <CategoriesAdminPage title={title} />;
}
