import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page, revalidate } = createLegalPage({
  slug: 'terms',
  metadataKey: 'terms',
});

export { generateMetadata, revalidate };
export default Page;
