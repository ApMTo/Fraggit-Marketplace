'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AttributeList } from '@/features/admin/components/attribute-list';
import {
  useCategoryAttributes,
  useSubcategory,
  useSubcategoryAttributes,
} from '@/hooks';
import type {
  AttributeDefinitionPublic,
  SubcategoryAdmin,
} from '@/types/category';

type SubcategoryDetailPanelProps = {
  subcategoryId: string;
  categoryId: string;
  onEditSubcategory: (subcategory: SubcategoryAdmin) => void;
  onDeleteSubcategory: (subcategory: SubcategoryAdmin) => void;
  onCreateAttribute: () => void;
  onEditAttribute: (attribute: AttributeDefinitionPublic) => void;
  onDeleteAttribute: (attribute: AttributeDefinitionPublic) => void;
};

export function SubcategoryDetailPanel({
  subcategoryId,
  categoryId,
  onEditSubcategory,
  onDeleteSubcategory,
  onCreateAttribute,
  onEditAttribute,
  onDeleteAttribute,
}: SubcategoryDetailPanelProps) {
  const t = useTranslations('admin.categories.subcategoryDetail');

  const { data: subcategory, isLoading } = useSubcategory(subcategoryId);
  const { data: categoryAttributes } = useCategoryAttributes(categoryId);
  const { data: attributes, isLoading: attributesLoading } =
    useSubcategoryAttributes(subcategoryId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!subcategory) {
    return null;
  }

  const linkedGlobalAttributes =
    categoryAttributes?.filter((attribute) =>
      subcategory.globalAttributeIds.includes(attribute.id),
    ) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-wide text-subtle">
            {t('subtitle')}
          </p>
          <h2 className="truncate text-2xl font-semibold text-foreground">
            {subcategory.name}
          </h2>
          <p className="font-mono text-sm text-subtle">{subcategory.slug}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEditSubcategory(subcategory)}
          >
            <Pencil className="size-4" />
            {t('editSubcategory')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDeleteSubcategory(subcategory)}
          >
            <Trash2 className="size-4" />
            {t('deleteSubcategory')}
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t('linkedGlobalAttributes')}
        </h3>
        {linkedGlobalAttributes.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {linkedGlobalAttributes.map((attribute) => (
              <li
                key={attribute.id}
                className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-xs text-muted"
              >
                {attribute.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle">{t('noLinkedGlobalAttributes')}</p>
        )}
      </section>

      <AttributeList
        attributes={attributes}
        isLoading={attributesLoading}
        onCreate={onCreateAttribute}
        onEdit={onEditAttribute}
        onDelete={onDeleteAttribute}
        createLabel={t('createAttribute')}
        emptyTitle={t('noAttributes')}
        emptyDescription={t('noAttributesHint')}
      />
    </div>
  );
}
