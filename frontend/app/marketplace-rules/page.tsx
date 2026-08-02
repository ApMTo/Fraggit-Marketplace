import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page } = createLegalPage({
  slug: 'marketplace-rules',
  metadataKey: 'marketplaceRules',
});

export { generateMetadata };
export default Page;
