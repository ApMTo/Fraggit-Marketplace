import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { CACHE_TTL } from '@/lib/cache-config';
import {
  LegalDocumentPage,
  getAllLegalDocuments,
  getLegalDocument,
  type LegalDocumentSlug,
} from '@/features/legal';

type LegalPageConfig = {
  slug: LegalDocumentSlug;
  metadataKey: 'terms' | 'privacy' | 'marketplaceRules' | 'sellerPolicy';
};

export function createLegalPage({ slug, metadataKey }: LegalPageConfig) {
  async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations(`legal.pages.${metadataKey}`);
    return {
      title: `${t('title')} | Fraggit`,
      description: t('description'),
    };
  }

  async function Page() {
    const locale = (await getLocale()) as Locale;
    const t = await getTranslations('legal.document');
    const document = getLegalDocument(slug, locale);
    const allDocuments = getAllLegalDocuments(locale);

    const relatedLinks = allDocuments
      .filter((item) => item.slug !== slug)
      .map((item) => ({
        href: `/${item.slug}`,
        label: item.title,
      }));

    return (
      <LegalDocumentPage
        document={document}
        relatedLinks={relatedLinks}
        versionLabel={t('version')}
        lastUpdatedLabel={t('lastUpdated')}
        relatedTitle={t('related')}
      />
    );
  }

  return { generateMetadata, Page, revalidate: CACHE_TTL.legal };
}
