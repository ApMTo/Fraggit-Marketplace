'use client';

import { ChevronDown, ChevronRight, FolderTree, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useSubcategories } from '@/hooks/use-subcategories';
import type { CategoryPublic } from '@/types/category';
import type { AdminSelection } from '@/features/admin/types';

type CategoryTreePanelProps = {
  categories: CategoryPublic[];
  isLoading: boolean;
  selection: AdminSelection | null;
  expandedCategoryIds: ReadonlySet<string>;
  onToggleExpand: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string) => void;
};

export function CategoryTreePanel({
  categories,
  isLoading,
  selection,
  expandedCategoryIds,
  onToggleExpand,
  onSelectCategory,
  onSelectSubcategory,
}: CategoryTreePanelProps) {
  const t = useTranslations('admin.categories.tree');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FolderTree}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
      />
    );
  }

  return (
    <ul className="space-y-1">
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          isExpanded={expandedCategoryIds.has(category.id)}
          isSelected={
            selection?.type === 'category' && selection.categoryId === category.id
          }
          selectedSubcategoryId={
            selection?.type === 'subcategory' &&
            selection.categoryId === category.id
              ? selection.subcategoryId
              : null
          }
          onToggleExpand={onToggleExpand}
          onSelectCategory={onSelectCategory}
          onSelectSubcategory={onSelectSubcategory}
        />
      ))}
    </ul>
  );
}

type CategoryTreeNodeProps = {
  category: CategoryPublic;
  isExpanded: boolean;
  isSelected: boolean;
  selectedSubcategoryId: string | null;
  onToggleExpand: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string) => void;
};

function CategoryTreeNode({
  category,
  isExpanded,
  isSelected,
  selectedSubcategoryId,
  onToggleExpand,
  onSelectCategory,
  onSelectSubcategory,
}: CategoryTreeNodeProps) {
  const { data: subcategories, isLoading } = useSubcategories(
    isExpanded ? category.id : null,
  );

  return (
    <li>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          onClick={() => onToggleExpand(category.id)}
          className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm transition-colors ${
            isSelected
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground hover:bg-surface-hover'
          }`}
        >
          {category.iconUrl ? (
            <AppImage
              src={category.iconUrl}
              alt=""
              width={20}
              height={20}
              sizes="20px"
              className="size-5 shrink-0 rounded object-cover"
            />
          ) : (
            <Layers className="size-4 shrink-0 text-subtle" />
          )}
          <span className="truncate font-medium">{category.name}</span>
        </button>
      </div>

      {isExpanded ? (
        <ul className="ml-7 mt-1 space-y-1 border-l border-border pl-2">
          {isLoading ? (
            <li className="flex items-center gap-2 px-2 py-2 text-xs text-subtle">
              <Spinner size="sm" />
            </li>
          ) : subcategories && subcategories.length > 0 ? (
            subcategories.map((subcategory) => (
              <li key={subcategory.id}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectSubcategory(category.id, subcategory.id)
                  }
                  className={`w-full truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm transition-colors ${
                    selectedSubcategoryId === subcategory.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted hover:bg-surface-hover hover:text-foreground'
                  }`}
                >
                  {subcategory.name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-1.5 text-xs text-subtle">—</li>
          )}
        </ul>
      ) : null}
    </li>
  );
}
