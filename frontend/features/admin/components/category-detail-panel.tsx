'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AttributeList } from '@/features/admin/components/attribute-list';
import {
  useCategoryAttributes,
  useSubcategories,
} from '@/hooks';
import type {
  AttributeDefinitionPublic,
  CategoryAdmin,
  SubcategoryPublic,
} from '@/types/category';

type CategoryDetailPanelProps = {
  category: CategoryAdmin | undefined;
  isLoading: boolean;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onCreateSubcategory: () => void;
  onEditSubcategory: (subcategory: SubcategoryPublic) => void;
  onDeleteSubcategory: (subcategory: SubcategoryPublic) => void;
  onCreateAttribute: () => void;
  onEditAttribute: (attribute: AttributeDefinitionPublic) => void;
  onDeleteAttribute: (attribute: AttributeDefinitionPublic) => void;
};

export function CategoryDetailPanel({
  category,
  isLoading,
  onEditCategory,
  onDeleteCategory,
  onCreateSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onCreateAttribute,
  onEditAttribute,
  onDeleteAttribute,
}: CategoryDetailPanelProps) {
  const t = useTranslations('admin.categories.detail');
  const categoryId = category?.id ?? null;

  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(categoryId);
  const { data: attributes, isLoading: attributesLoading } =
    useCategoryAttributes(categoryId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {category.previewUrl ? (
            <AppImage
              src={category.previewUrl}
              alt=""
              width={64}
              height={64}
              sizes="64px"
              className="size-16 shrink-0 rounded-[var(--radius-sm)] border border-border object-cover"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-2xl font-semibold text-foreground">
              {category.name}
            </h2>
            <p className="font-mono text-sm text-subtle">{category.slug}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onEditCategory}>
            <Pencil className="size-4" />
            {t('editCategory')}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDeleteCategory}>
            <Trash2 className="size-4" />
            {t('deleteCategory')}
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t('subcategories')}
          </h3>
          <Button size="sm" variant="secondary" onClick={onCreateSubcategory}>
            <Plus className="size-4" />
            {t('createSubcategory')}
          </Button>
        </div>

        {subcategoriesLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" />
          </div>
        ) : subcategories && subcategories.length > 0 ? (
          <ul className="divide-y divide-border rounded-[var(--radius-sm)] border border-border">
            {subcategories.map((subcategory) => (
              <li
                key={subcategory.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {subcategory.name}
                  </p>
                  <p className="truncate font-mono text-xs text-subtle">
                    {subcategory.slug}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditSubcategory(subcategory)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteSubcategory(subcategory)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle">{t('noSubcategories')}</p>
        )}
      </section>

      <AttributeList
        attributes={attributes}
        isLoading={attributesLoading}
        onCreate={onCreateAttribute}
        onEdit={onEditAttribute}
        onDelete={onDeleteAttribute}
        createLabel={t('createGlobalAttribute')}
        emptyTitle={t('noGlobalAttributes')}
        emptyDescription={t('noGlobalAttributesHint')}
      />
    </div>
  );
}
