'use client';

import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { resolveAdminErrorKey } from '@/lib/admin-errors';
import {
  validateSubcategoryName,
  validateSubcategorySlug,
} from '@/lib/validation/admin';
import { useSubcategoryMutations } from '@/hooks/use-subcategories';
import type {
  AttributeDefinitionPublic,
  SubcategoryAdmin,
} from '@/types/category';
import type { SubcategoryDialogState } from '@/features/admin/types';

type SubcategoryFormValues = {
  nameEn: string;
  nameRu: string;
  slug: string;
  globalAttributeIds: string[];
};

type SubcategoryFormDialogProps = {
  dialog: SubcategoryDialogState | null;
  subcategory?: SubcategoryAdmin;
  globalAttributes: AttributeDefinitionPublic[];
  onClose: () => void;
  onSuccess: (subcategoryId: string) => void;
};

export function SubcategoryFormDialog({
  dialog,
  subcategory,
  globalAttributes,
  onClose,
  onSuccess,
}: SubcategoryFormDialogProps) {
  const t = useTranslations('admin.categories.subcategoryForm');
  const tErrors = useTranslations('admin.errors');
  const tValidation = useTranslations('admin.validation');
  const categoryId = dialog?.categoryId ?? null;
  const { createMutation, updateMutation } = useSubcategoryMutations(categoryId);

  const isEdit = dialog?.mode === 'edit';

  const formik = useFormik<SubcategoryFormValues>({
    enableReinitialize: true,
    initialValues: {
      nameEn: subcategory?.translations.en ?? '',
      nameRu: subcategory?.translations.ru ?? '',
      slug: subcategory?.slug ?? '',
      globalAttributeIds: subcategory?.globalAttributeIds ?? [],
    },
    validate: (values) => {
      const errors: Partial<Record<keyof SubcategoryFormValues, string>> = {};

      const nameEnError = validateSubcategoryName(values.nameEn);
      if (nameEnError) {
        errors.nameEn = tValidation(nameEnError);
      }

      if (values.nameRu.trim()) {
        const nameRuError = validateSubcategoryName(values.nameRu);
        if (nameRuError) {
          errors.nameRu = tValidation(nameRuError);
        }
      }

      const slugError = validateSubcategorySlug(values.slug);
      if (slugError) {
        errors.slug = tValidation(slugError);
      }

      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      if (!dialog) {
        return;
      }

      try {
        const payload = {
          name: {
            en: values.nameEn.trim(),
            ...(values.nameRu.trim()
              ? { ru: values.nameRu.trim() }
              : {}),
          },
          slug: values.slug.trim() || undefined,
          globalAttributeIds: values.globalAttributeIds,
        };

        if (isEdit && dialog.mode === 'edit') {
          const updated = await updateMutation.mutateAsync({
            id: dialog.subcategoryId,
            payload,
          });
          toast.success(t('updateSuccess'));
          onSuccess(updated.id);
        } else {
          const created = await createMutation.mutateAsync(payload);
          toast.success(t('createSuccess'));
          onSuccess(created.id);
        }

        onClose();
      } catch (error) {
        setStatus({ formError: tErrors(resolveAdminErrorKey(error)) });
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!dialog) {
    return null;
  }

  const clearFormError = () => {
    if (formik.status?.formError) {
      formik.setStatus(undefined);
    }
  };

  const toggleGlobalAttribute = (attributeId: string, checked: boolean) => {
    clearFormError();
    const current = formik.values.globalAttributeIds;

    formik.setFieldValue(
      'globalAttributeIds',
      checked
        ? [...current, attributeId]
        : current.filter((id) => id !== attributeId),
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? t('editTitle') : t('createTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() => formik.handleSubmit()}
            isLoading={formik.isSubmitting}
          >
            {isEdit ? t('save') : t('create')}
          </Button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        {formik.status?.formError ? (
          <FormError>{formik.status.formError}</FormError>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="subcategory-name-en">{t('nameEn')}</Label>
          <Input
            id="subcategory-name-en"
            name="nameEn"
            value={formik.values.nameEn}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.nameEn && formik.errors.nameEn)}
          />
          {formik.touched.nameEn && formik.errors.nameEn ? (
            <p className="text-xs text-destructive">{formik.errors.nameEn}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory-name-ru">{t('nameRu')}</Label>
          <Input
            id="subcategory-name-ru"
            name="nameRu"
            value={formik.values.nameRu}
            placeholder={t('nameRuPlaceholder')}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.nameRu && formik.errors.nameRu)}
          />
          {formik.touched.nameRu && formik.errors.nameRu ? (
            <p className="text-xs text-destructive">{formik.errors.nameRu}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory-slug">{t('slug')}</Label>
          <Input
            id="subcategory-slug"
            name="slug"
            value={formik.values.slug}
            placeholder={t('slugPlaceholder')}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.slug && formik.errors.slug)}
          />
          {formik.touched.slug && formik.errors.slug ? (
            <p className="text-xs text-destructive">{formik.errors.slug}</p>
          ) : null}
        </div>

        {globalAttributes.length > 0 ? (
          <div className="space-y-3">
            <Label>{t('globalAttributes')}</Label>
            <p className="text-xs text-subtle">{t('globalAttributesHint')}</p>
            <ul className="space-y-2 rounded-[var(--radius-sm)] border border-border p-3">
              {globalAttributes.map((attribute) => {
                const checked = formik.values.globalAttributeIds.includes(
                  attribute.id,
                );

                return (
                  <li
                    key={attribute.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {attribute.label}
                      </p>
                      <p className="truncate font-mono text-xs text-subtle">
                        {attribute.key}
                      </p>
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleGlobalAttribute(attribute.id, value)
                      }
                      aria-label={attribute.label}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}
