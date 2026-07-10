import Link from 'next/link';
import type { CategoryItem } from '../types';
import { LandingSection } from './landing-section';
import { SectionHeader } from './section-header';

type CategoryCardProps = {
  name: string;
  description: string;
  icon: CategoryItem['icon'];
  gradient: string;
  href: string;
};

function CategoryCard({
  name,
  description,
  icon: Icon,
  gradient,
  href,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="landing-card-hover group flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5"
    >
      <div
        className={`flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br ${gradient} transition-[box-shadow] duration-300 group-hover:shadow-[var(--glow-blue)]`}
      >
        <Icon className="size-5 text-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-foreground">
          {name}
        </h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}

type CategoriesSectionProps = {
  title: string;
  subtitle: string;
  categories: CategoryItem[];
  getCategoryName: (key: string) => string;
  getCategoryDescription: (key: string) => string;
  listingsHref: string;
};

export function CategoriesSection({
  title,
  subtitle,
  categories,
  getCategoryName,
  getCategoryDescription,
  listingsHref,
}: CategoriesSectionProps) {
  return (
    <LandingSection id="categories">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.key}
            name={getCategoryName(category.key)}
            description={getCategoryDescription(category.key)}
            icon={category.icon}
            gradient={category.gradient}
            href={listingsHref}
          />
        ))}
      </div>
    </LandingSection>
  );
}
