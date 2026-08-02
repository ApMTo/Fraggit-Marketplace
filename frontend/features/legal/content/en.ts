import { LEGAL_VERSION } from '../constants';
import type { LegalDocument } from '../types';

const terms: LegalDocument = {
  slug: 'terms',
  version: LEGAL_VERSION,
  title: 'Terms of Service',
  lastUpdated: 'July 30, 2026',
  intro:
    'These Terms of Service ("Terms") govern your access to and use of the Fraggit platform (the "Platform"), operated from the Republic of Armenia. By creating an account or using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.',
  sections: [
    {
      id: '1',
      title: '1. Definitions',
      paragraphs: [
        '"Platform" means the Fraggit website, applications, and related services.',
        '"User" means any person who registers or uses the Platform.',
        '"Seller" means a User who lists goods or services for sale.',
        '"Buyer" means a User who purchases goods or services through the Platform.',
        '"Lot" means a listing created by a Seller on the Platform.',
        '"Order" means a transaction initiated when a Buyer purchases a Lot.',
        '"Digital goods" means accounts, in-game items, subscriptions, services, and other intangible products offered on the Platform.',
      ],
    },
    {
      id: '2',
      title: '2. Role of Fraggit',
      paragraphs: [
        'Fraggit is an intermediary marketplace that connects Buyers and Sellers. Fraggit is not the seller of goods listed on the Platform and does not own the items offered by Sellers, except where explicitly stated.',
        'Fraggit provides technical infrastructure, moderation tools, dispute handling, and communication features. The contract of sale is between the Buyer and the Seller.',
        'Fraggit may charge service fees, commissions, or other charges as disclosed on the Platform or in separate fee schedules.',
      ],
    },
    {
      id: '3',
      title: '3. Eligibility and Account',
      bullets: [
        'You must be at least 18 years old or the age of legal majority in your jurisdiction.',
        'You must provide accurate registration information and keep it up to date.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You may not create multiple accounts to evade restrictions, bans, or moderation decisions.',
        'Fraggit may suspend or terminate accounts that violate these Terms or applicable law.',
      ],
    },
    {
      id: '4',
      title: '4. Acceptable Use',
      bullets: [
        'Do not list, sell, or purchase stolen, hacked, fraudulently obtained, or illegally acquired goods.',
        'Do not use the Platform for money laundering, fraud, or any unlawful activity.',
        'Do not harass, threaten, or abuse other Users or Fraggit staff.',
        'Do not attempt to bypass Platform security, moderation, or payment systems.',
        'Do not scrape, reverse engineer, or overload Platform infrastructure without permission.',
        'Comply with the terms of service of third-party games, platforms, or services related to listed goods.',
      ],
    },
    {
      id: '5',
      title: '5. Orders, Delivery, and Confirmation',
      paragraphs: [
        'When a Buyer places an Order, they enter into a transaction with the Seller. The Seller is responsible for delivering the goods or completing the service as described in the Lot.',
        'For account-type Lots, the Seller must provide access credentials or data as described. For service-type Lots, the Seller must complete the agreed service.',
        'The Buyer must review received goods promptly. If the Buyer does not open a dispute within the timeframe shown in the Order, the Order may be automatically confirmed as completed.',
        'Automatic confirmation means the Buyer acknowledges receipt and satisfaction, subject to the Marketplace Rules and dispute policy.',
      ],
    },
    {
      id: '6',
      title: '6. Disputes and Moderation',
      paragraphs: [
        'Users may open disputes on eligible Orders. Fraggit moderators may review evidence, chat history, and Order details.',
        'Moderation decisions are binding within the Platform to the extent permitted by applicable law. Fraggit may favor the Buyer, the Seller, or take no action depending on the circumstances.',
        'Fraggit is not obligated to provide refunds where payment processing or refund infrastructure is not yet available, unless required by law or explicitly stated in the Marketplace Rules.',
      ],
    },
    {
      id: '7',
      title: '7. Fees and Payments',
      paragraphs: [
        'Payment methods, settlement timing, and refund mechanics may vary by feature availability and region.',
        'Fraggit may update fees with reasonable notice where required. Continued use after changes constitutes acceptance of updated fees, unless prohibited by law.',
        'Users are responsible for any taxes, duties, or charges applicable to their transactions, unless otherwise stated.',
      ],
    },
    {
      id: '8',
      title: '8. Intellectual Property',
      paragraphs: [
        'Fraggit and its licensors own the Platform, branding, software, and design. Users retain ownership of content they submit but grant Fraggit a license to host, display, and process that content for Platform operation.',
        'Users must not infringe third-party intellectual property rights when listing or selling goods.',
      ],
    },
    {
      id: '9',
      title: '9. Limitation of Liability',
      paragraphs: [
        'To the maximum extent permitted by the laws of the Republic of Armenia, Fraggit is not liable for indirect, incidental, special, or consequential damages arising from use of the Platform.',
        'Fraggit does not guarantee uninterrupted access, error-free operation, or the accuracy of User-generated listings.',
        'Fraggit\'s total liability for any claim relating to the Platform shall not exceed the greater of (a) fees paid by you to Fraggit in the three months preceding the claim, or (b) the equivalent of 10,000 Armenian drams, unless a higher minimum is required by mandatory law.',
      ],
    },
    {
      id: '10',
      title: '10. Suspension and Termination',
      bullets: [
        'Fraggit may suspend or terminate access for violations, fraud risk, legal requirements, or operational reasons.',
        'Users may close their accounts subject to completion of open Orders and dispute resolution.',
        'Provisions that by nature should survive termination (liability limits, governing law, dispute resolution) remain in effect.',
      ],
    },
    {
      id: '11',
      title: '11. Changes to Terms',
      paragraphs: [
        'Fraggit may update these Terms. Material changes will be communicated through the Platform or by email where appropriate.',
        'The version and effective date are shown at the top of this document. Continued use after the effective date constitutes acceptance, unless you delete your account before the change takes effect.',
      ],
    },
    {
      id: '12',
      title: '12. Governing Law and Jurisdiction',
      paragraphs: [
        'These Terms are governed by the laws of the Republic of Armenia, without regard to conflict-of-law rules.',
        'Disputes arising from these Terms or use of the Platform shall be subject to the exclusive jurisdiction of the competent courts of the Republic of Armenia, unless mandatory consumer protection rules provide otherwise.',
      ],
    },
    {
      id: '13',
      title: '13. Contact',
      paragraphs: [
        'For legal inquiries regarding these Terms, contact Fraggit support through the channels listed on the Platform.',
      ],
    },
  ],
  disclaimer:
    'This document is a template prepared for the Fraggit platform and should be reviewed by qualified legal counsel licensed in the Republic of Armenia before production use.',
};

const privacy: LegalDocument = {
  slug: 'privacy',
  version: LEGAL_VERSION,
  title: 'Privacy Policy',
  lastUpdated: 'July 30, 2026',
  intro:
    'This Privacy Policy explains how Fraggit ("we", "us") collects, uses, stores, and shares personal data when you use our marketplace services. We process data in accordance with the Law of the Republic of Armenia on Personal Data Protection and other applicable legislation.',
  sections: [
    {
      id: '1',
      title: '1. Data Controller',
      paragraphs: [
        'Fraggit operates the Platform and acts as the data controller for personal data described in this Policy, unless otherwise stated for specific processing activities.',
      ],
    },
    {
      id: '2',
      title: '2. Data We Collect',
      bullets: [
        'Account data: username, display name, email address, password hash, profile information.',
        'Transaction data: Orders, Lots, payment-related metadata, delivery credentials (processed for order fulfillment).',
        'Communication data: chat messages, dispute tickets, support requests, moderation records.',
        'Technical data: IP address, device/browser information, session identifiers, cookies, logs.',
        'Security data: two-factor authentication settings, login history, fraud-prevention signals.',
        'User-generated content: reviews, reports, listings, and uploaded images.',
      ],
    },
    {
      id: '3',
      title: '3. How We Use Data',
      bullets: [
        'Provide, maintain, and improve the Platform.',
        'Process registrations, logins, Orders, and dispute resolution.',
        'Send transactional emails (verification, security alerts, order updates).',
        'Enforce Terms, Marketplace Rules, and protect Users from fraud and abuse.',
        'Comply with legal obligations and respond to lawful requests.',
        'Analyze aggregated usage to improve performance and user experience.',
      ],
    },
    {
      id: '4',
      title: '4. Legal Bases for Processing',
      paragraphs: [
        'We process personal data based on one or more of the following grounds: performance of a contract (providing the Platform), your consent (where required), legitimate interests (security, fraud prevention, service improvement), and legal obligations.',
      ],
    },
    {
      id: '5',
      title: '5. Sharing of Data',
      bullets: [
        'Other Users: profile information, listings, and Order-related data visible as part of marketplace functionality.',
        'Service providers: hosting, email delivery, analytics, and security vendors under contractual safeguards.',
        'Moderators and staff: access to data necessary for support, moderation, and dispute resolution.',
        'Authorities: when required by law, court order, or to protect rights, safety, and Platform integrity.',
      ],
      paragraphs: [
        'We do not sell personal data to third parties for their independent marketing purposes.',
      ],
    },
    {
      id: '6',
      title: '6. International Transfers',
      paragraphs: [
        'Your data may be processed in the Republic of Armenia and other countries where our service providers operate. Where required, we implement appropriate safeguards for cross-border transfers.',
      ],
    },
    {
      id: '7',
      title: '7. Retention',
      paragraphs: [
        'We retain personal data for as long as necessary to provide services, resolve disputes, enforce agreements, and comply with legal obligations. Account data is generally retained while your account is active and for a reasonable period thereafter.',
        'Moderation logs, financial records, and dispute materials may be retained longer where required for legal, security, or audit purposes.',
      ],
    },
    {
      id: '8',
      title: '8. Security',
      paragraphs: [
        'We implement technical and organizational measures to protect personal data, including encryption in transit, access controls, and monitoring. No system is completely secure; please use a strong password and enable two-factor authentication where available.',
      ],
    },
    {
      id: '9',
      title: '9. Your Rights',
      bullets: [
        'Request access to your personal data.',
        'Request correction of inaccurate data.',
        'Request deletion where applicable and not overridden by legal retention duties.',
        'Object to or restrict certain processing where provided by law.',
        'Withdraw consent where processing is consent-based, without affecting prior lawful processing.',
        'Lodge a complaint with the competent personal data protection authority in the Republic of Armenia.',
      ],
    },
    {
      id: '10',
      title: '10. Cookies',
      paragraphs: [
        'We use essential cookies for authentication, security, and locale preferences. Additional analytics or marketing cookies, if introduced, will be disclosed with appropriate consent mechanisms where required.',
      ],
    },
    {
      id: '11',
      title: '11. Children',
      paragraphs: [
        'The Platform is not intended for individuals under 18. We do not knowingly collect personal data from children. If you believe a child has provided data, contact us to request deletion.',
      ],
    },
    {
      id: '12',
      title: '12. Changes',
      paragraphs: [
        'We may update this Privacy Policy. The current version and date are shown above. Material changes will be communicated through the Platform or by email where appropriate.',
      ],
    },
    {
      id: '13',
      title: '13. Contact',
      paragraphs: [
        'For privacy requests or questions, contact Fraggit support through the channels listed on the Platform.',
      ],
    },
  ],
  disclaimer:
    'This document is a template prepared for the Fraggit platform and should be reviewed by qualified legal counsel licensed in the Republic of Armenia before production use.',
};

const marketplaceRules: LegalDocument = {
  slug: 'marketplace-rules',
  version: LEGAL_VERSION,
  title: 'Marketplace Rules',
  lastUpdated: 'July 30, 2026',
  intro:
    'These Marketplace Rules describe how trading works on Fraggit, including order flow, delivery obligations, confirmations, disputes, and refund limitations. They supplement the Terms of Service and apply to all Buyers and Sellers.',
  sections: [
    {
      id: '1',
      title: '1. Listings and Accuracy',
      bullets: [
        'Sellers must describe Lots accurately, including game/platform, region, quantity, delivery method, and limitations.',
        'Misleading titles, false screenshots, or hidden restrictions are prohibited.',
        'Fraggit may remove, edit visibility of, or reject Lots that violate rules or applicable law.',
      ],
    },
    {
      id: '2',
      title: '2. Prohibited Goods and Services',
      bullets: [
        'Stolen, hacked, or fraudulently obtained accounts or items.',
        'Goods obtained in violation of third-party terms of service where sale is prohibited.',
        'Malware, phishing tools, or services intended to harm others.',
        'Illegal content or services under the laws of the Republic of Armenia or applicable jurisdictions.',
        'Anything that infringes intellectual property or privacy rights of third parties.',
      ],
    },
    {
      id: '3',
      title: '3. Order Flow',
      paragraphs: [
        'When a Buyer purchases a Lot, an Order is created. The Seller must fulfill the Order within a reasonable time and as described in the Lot.',
        'For ACCOUNT-type Lots, the Seller delivers access credentials or required data through the Platform\'s secure delivery flow.',
        'For SERVICE-type Lots, the Buyer may need to provide information requested by the Seller. The Seller marks the service complete when finished.',
      ],
    },
    {
      id: '4',
      title: '4. Buyer Confirmation and Auto-Approval',
      paragraphs: [
        'After delivery or service completion, the Buyer should verify the Order promptly.',
        'If the Buyer does not confirm receipt and does not open a dispute within the period shown in the Order interface (currently up to 3 days after delivery eligibility), the Order may be automatically approved.',
        'Auto-approval indicates that the transaction is considered completed on the Platform, subject to post-completion dispute rules where applicable.',
      ],
    },
    {
      id: '5',
      title: '5. Disputes',
      bullets: [
        'Eligible parties may open a dispute while the Order status allows it.',
        'Provide clear evidence: screenshots, chat logs, error messages, and delivery details.',
        'During an active dispute, auto-approval may be paused until moderation resolves the case.',
        'Moderation may decide in favor of the Buyer, Seller, or take no action based on available evidence.',
      ],
    },
    {
      id: '6',
      title: '6. Refunds and Chargebacks',
      paragraphs: [
        'Digital goods are generally non-returnable once delivered and confirmed, except where a dispute is resolved in the Buyer\'s favor or where mandatory consumer law requires otherwise.',
        'Refund processing depends on available payment infrastructure. Fraggit will describe refund mechanics when real payment providers are integrated.',
        'Abusive chargebacks or false dispute claims may result in account restrictions.',
      ],
    },
    {
      id: '7',
      title: '7. Reviews and Reputation',
      paragraphs: [
        'Users may leave reviews after completed Orders. Reviews must be honest and related to the transaction.',
        'Fraggit may remove reviews that are abusive, fraudulent, or violate Platform rules.',
      ],
    },
    {
      id: '8',
      title: '8. Enforcement',
      bullets: [
        'Warnings, listing removal, Order cancellation, suspension, or permanent ban.',
        'Withholding payouts or restricting selling privileges where supported by payment systems.',
        'Reporting to authorities where required by law.',
      ],
    },
    {
      id: '9',
      title: '9. Governing Law',
      paragraphs: [
        'These Marketplace Rules are governed by the laws of the Republic of Armenia and should be read together with the Terms of Service and Privacy Policy.',
      ],
    },
  ],
  disclaimer:
    'This document is a template prepared for the Fraggit platform and should be reviewed by qualified legal counsel licensed in the Republic of Armenia before production use.',
};

const sellerPolicy: LegalDocument = {
  slug: 'seller-policy',
  version: LEGAL_VERSION,
  title: 'Seller Policy',
  lastUpdated: 'July 30, 2026',
  intro:
    'This Seller Policy sets out additional obligations for Users who create and sell Lots on Fraggit. By listing goods or services, you agree to comply with this Policy in addition to the Terms of Service and Marketplace Rules.',
  sections: [
    {
      id: '1',
      title: '1. Seller Eligibility',
      bullets: [
        'You must have a verified Fraggit account in good standing.',
        'You must have the legal right to sell the goods or services you list.',
        'You must not list goods you do not possess or cannot deliver promptly.',
      ],
    },
    {
      id: '2',
      title: '2. Listing Requirements',
      bullets: [
        'Use clear titles and descriptions in the language expected by Buyers.',
        'Set accurate prices, stock levels, and delivery expectations.',
        'Upload only images you have the right to use.',
        'Select the correct category, subcategory, and Lot type (account or service).',
      ],
    },
    {
      id: '3',
      title: '3. Delivery Obligations',
      bullets: [
        'Deliver Orders promptly after purchase, typically within the timeframe stated in your Lot.',
        'For accounts: provide valid credentials and any instructions needed for access.',
        'For services: communicate professionally and complete work as described.',
        'Do not request payment or sensitive data outside the Platform\'s intended flows.',
      ],
    },
    {
      id: '4',
      title: '4. Prohibited Seller Conduct',
      bullets: [
        'Selling duplicate or already-sold accounts without disclosure.',
        'Intentionally delivering non-working or revoked access after sale.',
        'Manipulating reviews, ratings, or dispute outcomes.',
        'Creating multiple accounts to bypass bans or restrictions.',
        'Harassing Buyers or pressuring them to confirm Orders prematurely.',
      ],
    },
    {
      id: '5',
      title: '5. Fees and Payouts',
      paragraphs: [
        'Fraggit may charge commissions or service fees as disclosed on the Platform. Fee schedules may be updated with notice where required.',
        'Payout timing and methods depend on integrated payment providers and verification requirements.',
      ],
    },
    {
      id: '6',
      title: '6. Moderation and Sanctions',
      paragraphs: [
        'Violations may result in Lot removal, Order cancellation, suspension, or permanent termination of selling privileges.',
        'Repeated or severe violations may be reported to relevant authorities.',
      ],
    },
    {
      id: '7',
      title: '7. Taxes and Compliance',
      paragraphs: [
        'Sellers are responsible for declaring and paying applicable taxes on income earned through the Platform, in accordance with the laws of the Republic of Armenia and any other applicable jurisdictions.',
      ],
    },
    {
      id: '8',
      title: '8. Governing Law',
      paragraphs: [
        'This Seller Policy is governed by the laws of the Republic of Armenia.',
      ],
    },
  ],
  disclaimer:
    'This document is a template prepared for the Fraggit platform and should be reviewed by qualified legal counsel licensed in the Republic of Armenia before production use.',
};

export const legalDocumentsEn = {
  terms,
  privacy,
  'marketplace-rules': marketplaceRules,
  'seller-policy': sellerPolicy,
};
