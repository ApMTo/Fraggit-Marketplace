'use client';

import { useFormik } from 'formik';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChangeUsername } from '@/hooks/use-users';
import { resolveApiError } from '@/lib/api-errors';
import {
  formatCooldownDate,
  getIdentityCooldownEndsAt,
} from '@/lib/identity-cooldown';
import { validateUsername } from '@/lib/validation/auth';
import type { UserProfile } from '@/types/user';

type UsernameFormValues = {
  username: string;
};

type ChangeUsernameFormProps = {
  profile: UserProfile;
};

export function ChangeUsernameForm({ profile }: ChangeUsernameFormProps) {
  const t = useTranslations('settings.security.username');
  const tFields = useTranslations('auth.fields');
  const tValidation = useTranslations('auth.validation');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const changeUsername = useChangeUsername();

  const cooldownEndsAt = getIdentityCooldownEndsAt(profile.usernameChangedAt);
  const locked = Boolean(cooldownEndsAt);

  const formik = useFormik<UsernameFormValues>({
    enableReinitialize: true,
    initialValues: { username: profile.username },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof UsernameFormValues, string>> = {};

      const usernameError = validateUsername(values.username);
      if (usernameError) {
        errors.username = tValidation(usernameError);
      } else if (
        values.username.trim().toLowerCase() === profile.username.toLowerCase()
      ) {
        errors.username = t('sameUsername');
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        await changeUsername.mutateAsync({
          username: values.username.trim().toLowerCase(),
        });
        toast.success(t('success'));
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

      {locked && cooldownEndsAt ? (
        <p className="text-sm text-subtle">
          {t('cooldown', {
            date: formatCooldownDate(cooldownEndsAt, locale),
          })}
        </p>
      ) : null}

      {formik.status?.formError ? (
        <FormError>{formik.status.formError}</FormError>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="settings-username">{tFields('username')}</Label>
        <Input
          id="settings-username"
          name="username"
          autoComplete="username"
          disabled={locked}
          value={formik.values.username}
          onChange={(event) => {
            if (formik.status?.formError) {
              formik.setStatus(undefined);
            }
            formik.handleChange(event);
          }}
          onBlur={formik.handleBlur}
          hasError={Boolean(formik.touched.username && formik.errors.username)}
        />
        {formik.touched.username && formik.errors.username ? (
          <p className="text-xs text-destructive">{formik.errors.username}</p>
        ) : (
          <p className="text-xs text-subtle">{t('hint')}</p>
        )}
      </div>

      <Button type="submit" isLoading={formik.isSubmitting} disabled={locked}>
        {t('submit')}
      </Button>
    </form>
  );
}
