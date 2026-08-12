import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page, revalidate } = createLegalPage({
  slug: 'privacy',
  metadataKey: 'privacy',
});

export { generateMetadata, revalidate };
export default Page;
