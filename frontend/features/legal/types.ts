export type LegalDocumentSlug =
  | 'terms'
  | 'privacy'
  | 'marketplace-rules'
  | 'seller-policy';

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  version: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  disclaimer: string;
};
