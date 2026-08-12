import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page, revalidate } = createLegalPage({
  slug: 'marketplace-rules',
  metadataKey: 'marketplaceRules',
});

export { generateMetadata, revalidate };
export default Page;
