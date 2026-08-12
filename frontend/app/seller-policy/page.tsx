import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page, revalidate } = createLegalPage({
  slug: 'seller-policy',
  metadataKey: 'sellerPolicy',
});

export { generateMetadata, revalidate };
export default Page;
