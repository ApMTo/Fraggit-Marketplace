'use client';

import { useCallback, useMemo, useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { AttributeFormDialog } from '@/features/admin/components/attribute-form-dialog';
import { CategoryDetailPanel } from '@/features/admin/components/category-detail-panel';
import { CategoryFormDialog } from '@/features/admin/components/category-form-dialog';
import { CategoryTreePanel } from '@/features/admin/components/category-tree-panel';
import { SubcategoryDetailPanel } from '@/features/admin/components/subcategory-detail-panel';
import { SubcategoryFormDialog } from '@/features/admin/components/subcategory-form-dialog';
import type {
  AdminSelection,
  AttributeDialogState,
  CategoryDialogState,
  DeleteTarget,
  SubcategoryDialogState,
} from '@/features/admin/types';
import {
  useAttributeDefinition,
  useAttributeMutations,
  useCategory,
  useCategoryAttributes,
  useCategoryMutations,
  useCategories,
  useSubcategory,
  useSubcategoryMutations,
} from '@/hooks';
import { resolveAdminErrorKey } from '@/lib/admin-errors';
import type {
  AttributeDefinitionPublic,
  SubcategoryPublic,
} from '@/types/category';

type CategoriesAdminPageProps = {
  title: string;
};

export function CategoriesAdminPage({ title }: CategoriesAdminPageProps) {
  const t = useTranslations('admin.categories');
  const tErrors = useTranslations('admin.errors');
  const tConfirm = useTranslations('admin.confirm');

  const { data: categories, isLoading, isError } = useCategories();

  const [selection, setSelection] = useState<AdminSelection | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [categoryDialog, setCategoryDialog] =
    useState<CategoryDialogState | null>(null);
  const [subcategoryDialog, setSubcategoryDialog] =
    useState<SubcategoryDialogState | null>(null);
  const [attributeDialog, setAttributeDialog] =
    useState<AttributeDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCategoryId =
    selection?.type === 'category'
      ? selection.categoryId
      : selection?.type === 'subcategory'
        ? selection.categoryId
        : null;

  const { data: selectedCategory, isLoading: categoryLoading } = useCategory(
    selectedCategoryId,
  );
  const { data: editCategory } = useCategory(
    categoryDialog?.mode === 'edit' ? categoryDialog.categoryId : null,
  );
  const { data: editSubcategory } = useSubcategory(
    subcategoryDialog?.mode === 'edit' ? subcategoryDialog.subcategoryId : null,
  );
  const { data: editAttribute } = useAttributeDefinition(
    attributeDialog?.mode === 'edit' ? attributeDialog.attributeId : null,
  );
  const { data: categoryGlobalAttributes } = useCategoryAttributes(
    subcategoryDialog?.categoryId ?? null,
  );

  const { deleteMutation: deleteCategoryMutation } = useCategoryMutations();
  const { deleteMutation: deleteSubcategoryMutation } = useSubcategoryMutations(
    deleteTarget?.type === 'subcategory' ? deleteTarget.categoryId : selectedCategoryId,
  );
  const attributeDeleteScope =
    deleteTarget?.type === 'attribute' ? deleteTarget.scope : 'category';
  const attributeDeleteParentId =
    deleteTarget?.type === 'attribute' ? deleteTarget.parentId : null;
  const { deleteMutation: deleteAttributeMutation } = useAttributeMutations(
    attributeDeleteScope,
    attributeDeleteParentId,
  );

  const handleToggleExpand = useCallback((categoryId: string) => {
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelection({ type: 'category', categoryId });
    setExpandedCategoryIds((current) => new Set(current).add(categoryId));
  }, []);

  const handleSelectSubcategory = useCallback(
    (categoryId: string, subcategoryId: string) => {
      setSelection({ type: 'subcategory', categoryId, subcategoryId });
      setExpandedCategoryIds((current) => new Set(current).add(categoryId));
    },
    [],
  );

  const handleCategorySuccess = useCallback((categoryId: string) => {
    setSelection({ type: 'category', categoryId });
    setExpandedCategoryIds((current) => new Set(current).add(categoryId));
  }, []);

  const handleSubcategorySuccess = useCallback(
    (categoryId: string, subcategoryId: string) => {
      setSelection({ type: 'subcategory', categoryId, subcategoryId });
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'category') {
        await deleteCategoryMutation.mutateAsync(deleteTarget.id);
        setSelection(null);
        toast.success(t('delete.categorySuccess'));
      } else if (deleteTarget.type === 'subcategory') {
        await deleteSubcategoryMutation.mutateAsync(deleteTarget.id);
        setSelection({ type: 'category', categoryId: deleteTarget.categoryId });
        toast.success(t('delete.subcategorySuccess'));
      } else {
        await deleteAttributeMutation.mutateAsync(deleteTarget.id);
        toast.success(t('delete.attributeSuccess'));
      }

      setDeleteTarget(null);
    } catch (error) {
      toast.error(tErrors(resolveAdminErrorKey(error)));
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteTarget,
    deleteCategoryMutation,
    deleteSubcategoryMutation,
    deleteAttributeMutation,
    t,
    tErrors,
  ]);

  const deleteDescription = useMemo(() => {
    if (!deleteTarget) {
      return '';
    }

    if (deleteTarget.type === 'category') {
      return tConfirm('deleteCategory', { name: deleteTarget.name });
    }

    if (deleteTarget.type === 'subcategory') {
      return tConfirm('deleteSubcategory', { name: deleteTarget.name });
    }

    return tConfirm('deleteAttribute', { name: deleteTarget.name });
  }, [deleteTarget, tConfirm]);

  const openCreateAttributeDialog = useCallback(
    (scope: 'category' | 'subcategory', parentId: string, categoryId: string) => {
      setAttributeDialog({ mode: 'create', scope, parentId, categoryId });
    },
    [],
  );

  const openEditAttributeDialog = useCallback(
    (
      attribute: AttributeDefinitionPublic,
      scope: 'category' | 'subcategory',
      parentId: string,
      categoryId: string,
    ) => {
      setAttributeDialog({
        mode: 'edit',
        attributeId: attribute.id,
        scope,
        parentId,
        categoryId,
      });
    },
    [],
  );

  const openDeleteAttributeDialog = useCallback(
    (
      attribute: AttributeDefinitionPublic,
      scope: 'category' | 'subcategory',
      parentId: string,
      categoryId: string,
    ) => {
      setDeleteTarget({
        type: 'attribute',
        id: attribute.id,
        name: attribute.label,
        scope,
        parentId,
        categoryId,
      });
    },
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-6 px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-subtle">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setCategoryDialog({ mode: 'create' })}>
          <Plus className="size-4" />
          {t('createCategory')}
        </Button>
      </div>

      {isError ? (
        <EmptyState title={t('loadError')} description={t('loadErrorHint')} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <aside className="surface-card p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
              {t('tree.title')}
            </h2>
            <CategoryTreePanel
              categories={categories ?? []}
              isLoading={isLoading}
              selection={selection}
              expandedCategoryIds={expandedCategoryIds}
              onToggleExpand={handleToggleExpand}
              onSelectCategory={handleSelectCategory}
              onSelectSubcategory={handleSelectSubcategory}
            />
          </aside>

          <main className="surface-card min-h-[480px] p-6">
            {!selection ? (
              <EmptyState
                icon={FolderTree}
                title={t('selectPrompt.title')}
                description={t('selectPrompt.description')}
              />
            ) : selection.type === 'category' ? (
              <CategoryDetailPanel
                category={selectedCategory}
                isLoading={categoryLoading}
                onEditCategory={() =>
                  setCategoryDialog({
                    mode: 'edit',
                    categoryId: selection.categoryId,
                  })
                }
                onDeleteCategory={() =>
                  selectedCategory &&
                  setDeleteTarget({
                    type: 'category',
                    id: selectedCategory.id,
                    name: selectedCategory.name,
                  })
                }
                onCreateSubcategory={() =>
                  setSubcategoryDialog({
                    mode: 'create',
                    categoryId: selection.categoryId,
                  })
                }
                onEditSubcategory={(subcategory: SubcategoryPublic) =>
                  setSubcategoryDialog({
                    mode: 'edit',
                    categoryId: selection.categoryId,
                    subcategoryId: subcategory.id,
                  })
                }
                onDeleteSubcategory={(subcategory: SubcategoryPublic) =>
                  setDeleteTarget({
                    type: 'subcategory',
                    id: subcategory.id,
                    name: subcategory.name,
                    categoryId: selection.categoryId,
                  })
                }
                onCreateAttribute={() =>
                  openCreateAttributeDialog(
                    'category',
                    selection.categoryId,
                    selection.categoryId,
                  )
                }
                onEditAttribute={(attribute) =>
                  openEditAttributeDialog(
                    attribute,
                    'category',
                    selection.categoryId,
                    selection.categoryId,
                  )
                }
                onDeleteAttribute={(attribute) =>
                  openDeleteAttributeDialog(
                    attribute,
                    'category',
                    selection.categoryId,
                    selection.categoryId,
                  )
                }
              />
            ) : (
              <SubcategoryDetailPanel
                subcategoryId={selection.subcategoryId}
                categoryId={selection.categoryId}
                onEditSubcategory={(subcategory) =>
                  setSubcategoryDialog({
                    mode: 'edit',
                    categoryId: selection.categoryId,
                    subcategoryId: subcategory.id,
                  })
                }
                onDeleteSubcategory={(subcategory) =>
                  setDeleteTarget({
                    type: 'subcategory',
                    id: subcategory.id,
                    name: subcategory.name,
                    categoryId: selection.categoryId,
                  })
                }
                onCreateAttribute={() =>
                  openCreateAttributeDialog(
                    'subcategory',
                    selection.subcategoryId,
                    selection.categoryId,
                  )
                }
                onEditAttribute={(attribute) =>
                  openEditAttributeDialog(
                    attribute,
                    'subcategory',
                    selection.subcategoryId,
                    selection.categoryId,
                  )
                }
                onDeleteAttribute={(attribute) =>
                  openDeleteAttributeDialog(
                    attribute,
                    'subcategory',
                    selection.subcategoryId,
                    selection.categoryId,
                  )
                }
              />
            )}
          </main>
        </div>
      )}

      <CategoryFormDialog
        dialog={categoryDialog}
        category={editCategory}
        onClose={() => setCategoryDialog(null)}
        onSuccess={handleCategorySuccess}
      />

      <SubcategoryFormDialog
        dialog={subcategoryDialog}
        subcategory={editSubcategory}
        globalAttributes={categoryGlobalAttributes ?? []}
        onClose={() => setSubcategoryDialog(null)}
        onSuccess={(subcategoryId) => {
          if (subcategoryDialog) {
            handleSubcategorySuccess(
              subcategoryDialog.categoryId,
              subcategoryId,
            );
          }
        }}
      />

      <AttributeFormDialog
        dialog={attributeDialog}
        attribute={editAttribute}
        onClose={() => setAttributeDialog(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={tConfirm('title')}
        description={deleteDescription}
        confirmLabel={tConfirm('confirm')}
        cancelLabel={tConfirm('cancel')}
        isLoading={isDeleting}
      />
    </div>
  );
}
