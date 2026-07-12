'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type {
  AttributeDefinitionPublic,
  SubcategoryPublic,
} from '@/types/category';
import {
  listingsHref,
  type LotFilters,
} from '../lib/listings-search-params';

type LotFiltersPanelProps = {
  categorySlug: string;
  subcategories: SubcategoryPublic[];
  activeSubcategorySlug: string;
  attributes: AttributeDefinitionPublic[] | undefined;
  attributesLoading: boolean;
  filters: LotFilters;
  onFiltersChange: (filters: LotFilters) => void;
};

export function LotFiltersPanel({
  categorySlug,
  subcategories,
  activeSubcategorySlug,
  attributes,
  attributesLoading,
  filters,
  onFiltersChange,
}: LotFiltersPanelProps) {
  const t = useTranslations('listings');
  const hasAttributeFilters = Object.keys(filters).length > 0;

  function setFilter(key: string, value: string) {
    const next = { ...filters };
    if (!value.trim()) {
      delete next[key];
    } else {
      next[key] = value.trim();
    }
    onFiltersChange(next);
  }

  return (
    <aside className="surface-card flex h-fit flex-col gap-6 rounded-[var(--radius-lg)] p-4 lg:sticky lg:top-24">
      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
          {t('subcategoriesLabel')}
        </h2>
        <ul className="space-y-1.5" role="list">
          {subcategories.map((subcategory) => {
            const isActive = subcategory.slug === activeSubcategorySlug;

            return (
              <li key={subcategory.id}>
                <Link
                  href={listingsHref(categorySlug, subcategory.slug)}
                  className={cn(
                    'flex w-full items-center rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    isActive
                      ? 'border-transparent text-white [background-image:var(--gradient-brand)]'
                      : 'border-border bg-surface text-muted hover:border-border-strong hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {subcategory.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
            {t('filtersTitle')}
          </h2>
          {hasAttributeFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({})}
              className="h-8 px-2 text-xs"
            >
              {t('clearFilters')}
            </Button>
          ) : null}
        </div>

        {attributesLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : null}

        {!attributesLoading && (!attributes || attributes.length === 0) ? (
          <p className="text-sm text-subtle">{t('noFilters')}</p>
        ) : null}

        {!attributesLoading && attributes && attributes.length > 0 ? (
          <div className="space-y-4">
            {attributes.map((attribute) => (
              <AttributeFilterField
                key={attribute.id}
                attribute={attribute}
                value={filters[attribute.key] ?? ''}
                onChange={(value) => setFilter(attribute.key, value)}
              />
            ))}
          </div>
        ) : null}
      </section>
    </aside>
  );
}

type AttributeFilterFieldProps = {
  attribute: AttributeDefinitionPublic;
  value: string;
  onChange: (value: string) => void;
};

function AttributeFilterField({
  attribute,
  value,
  onChange,
}: AttributeFilterFieldProps) {
  const t = useTranslations('listings');

  switch (attribute.type) {
    case 'SELECT':
    case 'MULTISELECT':
      return (
        <FilterField label={attribute.label}>
          <Select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={attribute.label}
          >
            <option value="">{t('filterAny')}</option>
            {(attribute.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FilterField>
      );

    case 'BOOLEAN':
      return (
        <FilterField label={attribute.label}>
          <Select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={attribute.label}
          >
            <option value="">{t('filterAny')}</option>
            <option value="true">{t('filterYes')}</option>
            <option value="false">{t('filterNo')}</option>
          </Select>
        </FilterField>
      );

    case 'NUMBER':
      return (
        <FilterField label={attribute.label}>
          <DebouncedInput
            type="number"
            value={value}
            onCommit={onChange}
            placeholder={t('filterNumberPlaceholder')}
            aria-label={attribute.label}
          />
        </FilterField>
      );

    case 'TEXT':
    case 'TEXTAREA':
    default:
      return (
        <FilterField label={attribute.label}>
          <DebouncedInput
            type="text"
            value={value}
            onCommit={onChange}
            placeholder={t('filterTextPlaceholder')}
            aria-label={attribute.label}
          />
        </FilterField>
      );
  }
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted">{label}</Label>
      {children}
    </div>
  );
}

type DebouncedInputProps = {
  type: 'text' | 'number';
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  'aria-label': string;
};

function DebouncedInput({
  type,
  value,
  onCommit,
  placeholder,
  'aria-label': ariaLabel,
}: DebouncedInputProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = window.setTimeout(() => {
      onCommit(draft);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [draft, value, onCommit]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCommit(draft);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type={type}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(type === 'number' && '[appearance:textfield]')}
      />
    </form>
  );
}
