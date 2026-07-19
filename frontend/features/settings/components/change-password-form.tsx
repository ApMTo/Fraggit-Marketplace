'use client';

import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChangePassword } from '@/hooks/use-users';
import { resolveApiError } from '@/lib/api-errors';
import {
  validateLoginPassword,
  validatePasswordConfirmation,
  validateRegisterPassword,
} from '@/lib/validation/auth';

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordForm() {
  const t = useTranslations('settings.security.password');
  const tFields = useTranslations('auth.fields');
  const tValidation = useTranslations('auth.validation');
  const tErrors = useTranslations('errors');
  const changePassword = useChangePassword();

  const formik = useFormik<PasswordFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof PasswordFormValues, string>> = {};

      const currentError = validateLoginPassword(values.currentPassword);
      if (currentError) {
        errors.currentPassword = tValidation(currentError);
      }

      const newError = validateRegisterPassword(values.newPassword);
      if (newError) {
        errors.newPassword = tValidation(newError);
      }

      const confirmError = validatePasswordConfirmation(
        values.newPassword,
        values.confirmPassword,
      );
      if (confirmError) {
        errors.confirmPassword = tValidation(confirmError);
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus, resetForm }) => {
      setStatus(undefined);

      try {
        await changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
        toast.success(t('success'));
        resetForm();
      } catch (error) {
        const resolved = resolveApiError(error);
        setStatus({
          formError: tErrors(resolved.key, resolved.values),
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const clearFormError = () => {
    if (formik.status?.formError) {
      formik.setStatus(undefined);
    }
  };

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </div>

      {formik.status?.formError ? (
        <FormError>{formik.status.formError}</FormError>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="settings-current-password">{t('currentPassword')}</Label>
        <Input
          id="settings-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={formik.values.currentPassword}
          onChange={(event) => {
            clearFormError();
            formik.handleChange(event);
          }}
          onBlur={formik.handleBlur}
          hasError={Boolean(
            formik.touched.currentPassword && formik.errors.currentPassword,
          )}
        />
        {formik.touched.currentPassword && formik.errors.currentPassword ? (
          <p className="text-xs text-destructive">
            {formik.errors.currentPassword}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-new-password">{t('newPassword')}</Label>
        <Input
          id="settings-new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={formik.values.newPassword}
          onChange={(event) => {
            clearFormError();
            formik.handleChange(event);
          }}
          onBlur={formik.handleBlur}
          hasError={Boolean(
            formik.touched.newPassword && formik.errors.newPassword,
          )}
        />
        {formik.touched.newPassword && formik.errors.newPassword ? (
          <p className="text-xs text-destructive">{formik.errors.newPassword}</p>
        ) : (
          <p className="text-xs text-subtle">{t('hint')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-confirm-password">
          {tFields('confirmPassword')}
        </Label>
        <Input
          id="settings-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={formik.values.confirmPassword}
          onChange={(event) => {
            clearFormError();
            formik.handleChange(event);
          }}
          onBlur={formik.handleBlur}
          hasError={Boolean(
            formik.touched.confirmPassword && formik.errors.confirmPassword,
          )}
        />
        {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
          <p className="text-xs text-destructive">
            {formik.errors.confirmPassword}
          </p>
        ) : null}
      </div>

      <Button type="submit" isLoading={formik.isSubmitting}>
        {t('submit')}
      </Button>
    </form>
  );
}
