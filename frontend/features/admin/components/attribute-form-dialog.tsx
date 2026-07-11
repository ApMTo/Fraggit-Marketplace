'use client';

import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { resolveAdminErrorKey } from '@/lib/admin-errors';
import {
  formatOptionsForInput,
  parseOptionsInput,
  validateAttributeKey,
  validateAttributeLabel,
  validateAttributeOptions,
  validateSortOrder,
} from '@/lib/validation/admin';
import { useAttributeMutations } from '@/hooks/use-attribute-definitions';
import {
  ATTRIBUTE_TYPES,
  OPTION_ATTRIBUTE_TYPES,
  type AttributeDefinitionAdmin,
  type AttributeType,
} from '@/types/category';
import type { AttributeDialogState } from '@/features/admin/types';

type AttributeFormValues = {
  key: string;
  label: string;
  type: AttributeType;
  required: boolean;
  options: string;
  sortOrder: string;
};

type AttributeFormDialogProps = {
  dialog: AttributeDialogState | null;
  attribute?: AttributeDefinitionAdmin;
  onClose: () => void;
};

export function AttributeFormDialog({
  dialog,
  attribute,
  onClose,
}: AttributeFormDialogProps) {
  const t = useTranslations('admin.categories.attributeForm');
  const tErrors = useTranslations('admin.errors');
  const tValidation = useTranslations('admin.validation');

  const scope = dialog?.scope ?? 'category';
  const parentId = dialog?.parentId ?? null;
  const { createMutation, updateMutation } = useAttributeMutations(
    scope,
    parentId,
  );

  const isEdit = dialog?.mode === 'edit';

  const formik = useFormik<AttributeFormValues>({
    enableReinitialize: true,
    initialValues: {
      key: attribute?.key ?? '',
      label: attribute?.label ?? '',
      type: attribute?.type ?? 'TEXT',
      required: attribute?.required ?? false,
      options: formatOptionsForInput(attribute?.options ?? null),
      sortOrder: attribute?.sortOrder?.toString() ?? '0',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof AttributeFormValues, string>> = {};

      const keyError = validateAttributeKey(values.key);
      if (keyError) {
        errors.key = tValidation(keyError);
      }

      const labelError = validateAttributeLabel(values.label);
      if (labelError) {
        errors.label = tValidation(labelError);
      }

      const optionsError = validateAttributeOptions(
        values.type,
        parseOptionsInput(values.options),
      );
      if (optionsError) {
        errors.options = tValidation(optionsError);
      }

      const sortOrderError = validateSortOrder(values.sortOrder);
      if (sortOrderError) {
        errors.sortOrder = tValidation(sortOrderError);
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
        const options = parseOptionsInput(values.options);
        const payload = {
          key: values.key.trim().toLowerCase(),
          label: values.label.trim(),
          type: values.type,
          required: values.required,
          sortOrder: Number(values.sortOrder || '0'),
          ...(OPTION_ATTRIBUTE_TYPES.has(values.type) ? { options } : {}),
        };

        if (isEdit && dialog.mode === 'edit') {
          await updateMutation.mutateAsync({
            id: dialog.attributeId,
            payload,
          });
          toast.success(t('updateSuccess'));
        } else {
          await createMutation.mutateAsync(payload);
          toast.success(t('createSuccess'));
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

  const needsOptions = OPTION_ATTRIBUTE_TYPES.has(formik.values.type);

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
          <Label htmlFor="attribute-label">{t('label')}</Label>
          <Input
            id="attribute-label"
            name="label"
            value={formik.values.label}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.label && formik.errors.label)}
          />
          {formik.touched.label && formik.errors.label ? (
            <p className="text-xs text-destructive">{formik.errors.label}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="attribute-key">{t('key')}</Label>
          <Input
            id="attribute-key"
            name="key"
            value={formik.values.key}
            placeholder={t('keyPlaceholder')}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.key && formik.errors.key)}
          />
          {formik.touched.key && formik.errors.key ? (
            <p className="text-xs text-destructive">{formik.errors.key}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="attribute-type">{t('type')}</Label>
            <Select
              id="attribute-type"
              name="type"
              value={formik.values.type}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
            >
              {ATTRIBUTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribute-sort-order">{t('sortOrder')}</Label>
            <Input
              id="attribute-sort-order"
              name="sortOrder"
              type="number"
              min={0}
              step={1}
              value={formik.values.sortOrder}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
              onBlur={formik.handleBlur}
              hasError={Boolean(
                formik.touched.sortOrder && formik.errors.sortOrder,
              )}
            />
            {formik.touched.sortOrder && formik.errors.sortOrder ? (
              <p className="text-xs text-destructive">
                {formik.errors.sortOrder}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('required')}</p>
            <p className="text-xs text-subtle">{t('requiredHint')}</p>
          </div>
          <Switch
            checked={formik.values.required}
            onCheckedChange={(checked) => {
              clearFormError();
              formik.setFieldValue('required', checked);
            }}
            aria-label={t('required')}
          />
        </div>

        {needsOptions ? (
          <div className="space-y-2">
            <Label htmlFor="attribute-options">{t('options')}</Label>
            <Textarea
              id="attribute-options"
              name="options"
              value={formik.values.options}
              placeholder={t('optionsPlaceholder')}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
              onBlur={formik.handleBlur}
              hasError={Boolean(
                formik.touched.options && formik.errors.options,
              )}
            />
            <p className="text-xs text-subtle">{t('optionsHint')}</p>
            {formik.touched.options && formik.errors.options ? (
              <p className="text-xs text-destructive">{formik.errors.options}</p>
            ) : null}
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}
