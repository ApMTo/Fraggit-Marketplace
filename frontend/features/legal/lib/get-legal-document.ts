import type { Locale } from '@/i18n/config';
import { legalDocumentsEn } from '../content/en';
import { legalDocumentsRu } from '../content/ru';
import type { LegalDocument, LegalDocumentSlug } from '../types';

const documentsByLocale: Record<Locale, Record<LegalDocumentSlug, LegalDocument>> = {
  en: legalDocumentsEn,
  ru: legalDocumentsRu,
};

export function getLegalDocument(
  slug: LegalDocumentSlug,
  locale: Locale,
): LegalDocument {
  return documentsByLocale[locale][slug];
}

export function getAllLegalDocuments(locale: Locale): LegalDocument[] {
  return Object.values(documentsByLocale[locale]);
}
