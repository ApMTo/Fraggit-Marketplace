'use client';

import type { AttributeDefinitionPublic } from '@/types/category';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ListTree } from 'lucide-react';

type AttributeListProps = {
  attributes: AttributeDefinitionPublic[] | undefined;
  isLoading: boolean;
  onEdit: (attribute: AttributeDefinitionPublic) => void;
  onDelete: (attribute: AttributeDefinitionPublic) => void;
  onCreate: () => void;
  createLabel: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function AttributeList({
  attributes,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
  createLabel,
  emptyTitle,
  emptyDescription,
}: AttributeListProps) {
  const t = useTranslations('admin.categories.attributes');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
        <Button size="sm" variant="secondary" onClick={onCreate}>
          {createLabel}
        </Button>
      </div>

      {!attributes || attributes.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button size="sm" onClick={onCreate}>
              {createLabel}
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-4 py-3 font-medium">{t('columns.label')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.key')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.type')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.required')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.sortOrder')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.scope')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attribute) => (
                <tr
                  key={attribute.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {attribute.label}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {attribute.key}
                  </td>
                  <td className="px-4 py-3 text-muted">{attribute.type}</td>
                  <td className="px-4 py-3 text-muted">
                    {attribute.required ? t('yes') : t('no')}
                  </td>
                  <td className="px-4 py-3 text-muted">{attribute.sortOrder}</td>
                  <td className="px-4 py-3 text-muted">
                    {attribute.isGlobal ? t('global') : t('subcategory')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('edit')}
                        onClick={() => onEdit(attribute)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('delete')}
                        onClick={() => onDelete(attribute)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
