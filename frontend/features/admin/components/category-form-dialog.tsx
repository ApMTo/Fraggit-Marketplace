'use client';

import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveAdminErrorKey } from '@/lib/admin-errors';
import {
  validateCategoryName,
  validateCategorySlug,
} from '@/lib/validation/admin';
import { useCategoryMutations } from '@/hooks/use-categories';
import type { CategoryAdmin } from '@/types/category';
import type { CategoryDialogState } from '@/features/admin/types';

type CategoryFormValues = {
  name: string;
  slug: string;
  icon: File | null;
  preview: File | null;
};

type CategoryFormDialogProps = {
  dialog: CategoryDialogState | null;
  category?: CategoryAdmin;
  onClose: () => void;
  onSuccess: (categoryId: string) => void;
};

export function CategoryFormDialog({
  dialog,
  category,
  onClose,
  onSuccess,
}: CategoryFormDialogProps) {
  const t = useTranslations('admin.categories.form');
  const tErrors = useTranslations('admin.errors');
  const tValidation = useTranslations('admin.validation');
  const { createMutation, updateMutation } = useCategoryMutations();

  const isEdit = dialog?.mode === 'edit';

  const formik = useFormik<CategoryFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      icon: null,
      preview: null,
    },
    validate: (values) => {
      const errors: Partial<Record<keyof CategoryFormValues, string>> = {};

      const nameError = validateCategoryName(values.name);
      if (nameError) {
        errors.name = tValidation(nameError);
      }

      const slugError = validateCategorySlug(values.slug);
      if (slugError) {
        errors.slug = tValidation(slugError);
      }

      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        const payload = {
          name: values.name.trim(),
          slug: values.slug.trim() || undefined,
          ...(values.icon instanceof File ? { icon: values.icon } : {}),
          ...(values.preview instanceof File ? { preview: values.preview } : {}),
        };

        if (isEdit && dialog.mode === 'edit') {
          const updated = await updateMutation.mutateAsync({
            id: dialog.categoryId,
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
          <Label htmlFor="category-name">{t('name')}</Label>
          <Input
            id="category-name"
            name="name"
            value={formik.values.name}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.name && formik.errors.name)}
          />
          {formik.touched.name && formik.errors.name ? (
            <p className="text-xs text-destructive">{formik.errors.name}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-slug">{t('slug')}</Label>
          <Input
            id="category-slug"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FileField
            id="category-icon"
            label={t('icon')}
            currentUrl={category?.iconUrl}
            file={formik.values.icon}
            onChange={(file) => {
              clearFormError();
              formik.setFieldValue('icon', file);
            }}
          />
          <FileField
            id="category-preview"
            label={t('preview')}
            currentUrl={category?.previewUrl}
            file={formik.values.preview}
            onChange={(file) => {
              clearFormError();
              formik.setFieldValue('preview', file);
            }}
          />
        </div>
      </form>
    </Dialog>
  );
}

type FileFieldProps = {
  id: string;
  label: string;
  currentUrl?: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
};

function FileField({ id, label, currentUrl, file, onChange }: FileFieldProps) {
  const t = useTranslations('admin.categories.form');

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {currentUrl && !file ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt=""
          className="h-16 w-16 rounded-[var(--radius-sm)] border border-border object-cover"
        />
      ) : null}
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null);
        }}
      />
      {file ? (
        <p className="text-xs text-muted">{file.name}</p>
      ) : (
        <p className="text-xs text-subtle">{t('fileHint')}</p>
      )}
    </div>
  );
}
