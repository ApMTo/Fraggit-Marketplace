import { getTranslations } from 'next-intl/server';
import { LANDING_BENEFITS } from './data/benefits';
import { LANDING_CATEGORIES } from './data/categories';
import { LANDING_FAQ } from './data/faq';
import { LANDING_STEPS } from './data/steps';
import { CategoriesSection } from './components/categories-section';
import { CtaSectionWithAuth } from './components/cta-section-with-auth';
import { FaqSection } from './components/faq-section';
import { HeroSectionWithAuth } from './components/hero-section-with-auth';
import { HowItWorksSection } from './components/how-it-works-section';
import { LandingFooter } from './components/landing-footer';
import { LatestBlogSection } from './components/latest-blog-section';
import { WhyFraggitSection } from './components/why-fraggit-section';
import type { BlogPostCard } from '@/types/blog';

type HomePageProps = {
  latestPosts: BlogPostCard[];
};

export async function HomePage({ latestPosts }: HomePageProps) {
  const t = await getTranslations('landing');

  const currentYear = new Date().getFullYear();

  return (
    <>
      <HeroSectionWithAuth
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        startShoppingLabel={t('hero.startShopping')}
        becomeSellerLabel={t('hero.becomeSeller')}
      />

      <CategoriesSection
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
        categories={LANDING_CATEGORIES}
        listingsHref="/listings"
        getCategoryName={(key) =>
          t(`categories.items.${key}.name` as Parameters<typeof t>[0])
        }
        getCategoryDescription={(key) =>
          t(`categories.items.${key}.description` as Parameters<typeof t>[0])
        }
      />

      <LatestBlogSection posts={latestPosts} />

      <WhyFraggitSection
        title={t('benefits.title')}
        subtitle={t('benefits.subtitle')}
        benefits={LANDING_BENEFITS}
        getBenefitTitle={(key) =>
          t(`benefits.items.${key}.title` as Parameters<typeof t>[0])
        }
        getBenefitDescription={(key) =>
          t(`benefits.items.${key}.description` as Parameters<typeof t>[0])
        }
      />

      <HowItWorksSection
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
        steps={LANDING_STEPS}
        getStepTitle={(key) =>
          t(`howItWorks.steps.${key}.title` as Parameters<typeof t>[0])
        }
        getStepDescription={(key) =>
          t(`howItWorks.steps.${key}.description` as Parameters<typeof t>[0])
        }
      />

      <FaqSection
        title={t('faq.title')}
        subtitle={t('faq.subtitle')}
        items={LANDING_FAQ}
        getQuestion={(key) =>
          t(`faq.items.${key}.question` as Parameters<typeof t>[0])
        }
        getAnswer={(key) =>
          t(`faq.items.${key}.answer` as Parameters<typeof t>[0])
        }
      />

      <CtaSectionWithAuth
        title={t('cta.title')}
        subtitle={t('cta.subtitle')}
        startShoppingLabel={t('cta.startShopping')}
        createAccountLabel={t('cta.createAccount')}
      />

      <LandingFooter
        tagline={t('footer.tagline')}
        copyright={t('footer.copyright', { year: currentYear })}
        links={[
          { label: t('footer.about'), href: '#about' },
          { label: t('footer.privacy'), href: '/privacy' },
          { label: t('footer.terms'), href: '/terms' },
          { label: t('footer.marketplaceRules'), href: '/marketplace-rules' },
          { label: t('footer.sellerPolicy'), href: '/seller-policy' },
          { label: t('footer.support'), href: '#support' },
          { label: t('footer.contacts'), href: '#contacts' },
          { label: t('footer.blog'), href: '/blog' },
        ]}
        socialLinks={[
          { label: t('footer.telegram'), href: 'https://t.me/fraggit' },
          { label: t('footer.discord'), href: 'https://discord.gg/fraggit' },
        ]}
      />
    </>
  );
}
