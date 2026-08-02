import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page } = createLegalPage({
  slug: 'seller-policy',
  metadataKey: 'sellerPolicy',
});

export { generateMetadata };
export default Page;
