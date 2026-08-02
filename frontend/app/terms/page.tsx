import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page } = createLegalPage({
  slug: 'terms',
  metadataKey: 'terms',
});

export { generateMetadata };
export default Page;
