import { createLegalPage } from '@/features/legal/lib/create-legal-page';

const { generateMetadata, Page } = createLegalPage({
  slug: 'privacy',
  metadataKey: 'privacy',
});

export { generateMetadata };
export default Page;
