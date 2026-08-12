import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page } = createLegalPage({
  slug: 'marketplace-rules',
  metadataKey: 'marketplaceRules',
});

export { generateMetadata };
export const revalidate = 86_400;
export default Page;
