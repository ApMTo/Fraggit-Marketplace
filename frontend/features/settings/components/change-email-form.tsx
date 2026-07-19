'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useConfirmEmailChange,
  useRequestEmailChange,
} from '@/hooks/use-users';
import { resolveApiError } from '@/lib/api-errors';
import {
  formatCooldownDate,
  getIdentityCooldownEndsAt,
} from '@/lib/identity-cooldown';
import { validateEmail } from '@/lib/validation/auth';
import type { UserProfile } from '@/types/user';

type EmailFormValues = {
  newEmail: string;
  code: string;
};

type ChangeEmailFormProps = {
  profile: UserProfile;
};

export function ChangeEmailForm({ profile }: ChangeEmailFormProps) {
  const t = useTranslations('settings.security.email');
  const tFields = useTranslations('auth.fields');
  const tValidation = useTranslations('auth.validation');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const requestChange = useRequestEmailChange();
  const confirmChange = useConfirmEmailChange();
  const [codeSent, setCodeSent] = useState(false);

  const cooldownEndsAt = getIdentityCooldownEndsAt(profile.emailChangedAt);
  const locked = Boolean(cooldownEndsAt);

  const formik = useFormik<EmailFormValues>({
    enableReinitialize: true,
    initialValues: { newEmail: '', code: '' },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof EmailFormValues, string>> = {};

      const emailError = validateEmail(values.newEmail);
      if (emailError) {
        errors.newEmail = tValidation(emailError);
      } else if (
        values.newEmail.trim().toLowerCase() === profile.email.toLowerCase()
      ) {
        errors.newEmail = t('sameEmail');
      }

      if (codeSent) {
        if (!/^\d{6}$/.test(values.code.trim())) {
          errors.code = t('invalidCode');
        }
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus, resetForm }) => {
      setStatus(undefined);

      try {
        if (!codeSent) {
          await requestChange.mutateAsync({
            newEmail: values.newEmail.trim().toLowerCase(),
          });
          setCodeSent(true);
          toast.success(t('codeSent'));
          return;
        }

        await confirmChange.mutateAsync({ code: values.code.trim() });
        toast.success(t('success'));
        setCodeSent(false);
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
        <Label htmlFor="settings-current-email">{t('currentEmail')}</Label>
        <Input
          id="settings-current-email"
          value={profile.email}
          disabled
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-new-email">{tFields('email')}</Label>
        <Input
          id="settings-new-email"
          name="newEmail"
          type="email"
          autoComplete="email"
          disabled={locked || codeSent}
          value={formik.values.newEmail}
          onChange={(event) => {
            clearFormError();
            formik.handleChange(event);
          }}
          onBlur={formik.handleBlur}
          hasError={Boolean(formik.touched.newEmail && formik.errors.newEmail)}
        />
        {formik.touched.newEmail && formik.errors.newEmail ? (
          <p className="text-xs text-destructive">{formik.errors.newEmail}</p>
        ) : (
          <p className="text-xs text-subtle">{t('hint')}</p>
        )}
      </div>

      {codeSent ? (
        <div className="space-y-2">
          <Label htmlFor="settings-email-code">{t('code')}</Label>
          <Input
            id="settings-email-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={formik.values.code}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.code && formik.errors.code)}
          />
          {formik.touched.code && formik.errors.code ? (
            <p className="text-xs text-destructive">{formik.errors.code}</p>
          ) : (
            <p className="text-xs text-subtle">{t('codeHint')}</p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={formik.isSubmitting} disabled={locked}>
          {codeSent ? t('confirm') : t('sendCode')}
        </Button>
        {codeSent ? (
          <Button
            type="button"
            variant="ghost"
            disabled={formik.isSubmitting}
            onClick={() => {
              setCodeSent(false);
              void formik.setFieldValue('code', '');
              formik.setStatus(undefined);
            }}
          >
            {t('changeEmailAgain')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
