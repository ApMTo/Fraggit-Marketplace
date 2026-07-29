'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useConfirmTwoFactorEnable,
  useDisableTwoFactor,
  useRequestTwoFactorEnable,
} from '@/hooks/use-users';
import { resolveApiError } from '@/lib/api-errors';
import { validateLoginPassword } from '@/lib/validation/auth';
import type { UserProfile } from '@/types/user';

type EnableFormValues = {
  code: string;
};

type DisableFormValues = {
  currentPassword: string;
};

type TwoFactorFormProps = {
  profile: UserProfile;
};

export function TwoFactorForm({ profile }: TwoFactorFormProps) {
  const t = useTranslations('settings.security.twoFactor');
  const tValidation = useTranslations('auth.validation');
  const tErrors = useTranslations('errors');
  const requestEnable = useRequestTwoFactorEnable();
  const confirmEnable = useConfirmTwoFactorEnable();
  const disableTwoFactor = useDisableTwoFactor();
  const [codeSent, setCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const enableFormik = useFormik<EnableFormValues>({
    initialValues: { code: '' },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof EnableFormValues, string>> = {};
      if (codeSent && !/^\d{6}$/.test(values.code.trim())) {
        errors.code = t('invalidCode');
      }
      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus, resetForm }) => {
      setStatus(undefined);

      try {
        if (!codeSent) {
          const result = await requestEnable.mutateAsync();
          setCodeSent(true);
          setResendSeconds(result.resendAvailableInSeconds || 30);
          toast.success(t('codeSent'));
          return;
        }

        await confirmEnable.mutateAsync({ code: values.code.trim() });
        toast.success(t('enabled'));
        setCodeSent(false);
        resetForm();
      } catch (error) {
        const resolved = resolveApiError(error);
        if (resolved.key === 'two_factor_resend_cooldown') {
          setResendSeconds(30);
        }
        setStatus({
          formError: tErrors(resolved.key, resolved.values),
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const disableFormik = useFormik<DisableFormValues>({
    initialValues: { currentPassword: '' },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof DisableFormValues, string>> = {};
      const passwordError = validateLoginPassword(values.currentPassword);
      if (passwordError) {
        errors.currentPassword = tValidation(passwordError);
      }
      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus, resetForm }) => {
      setStatus(undefined);

      try {
        await disableTwoFactor.mutateAsync({
          currentPassword: values.currentPassword,
        });
        toast.success(t('disabled'));
        setShowDisable(false);
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

  async function handleResend() {
    if (resendSeconds > 0 || requestEnable.isPending) {
      return;
    }

    enableFormik.setStatus(undefined);

    try {
      const result = await requestEnable.mutateAsync();
      setResendSeconds(result.resendAvailableInSeconds || 30);
      toast.success(t('codeSent'));
    } catch (error) {
      const resolved = resolveApiError(error);
      if (resolved.key === 'two_factor_resend_cooldown') {
        setResendSeconds(30);
      }
      enableFormik.setStatus({
        formError: tErrors(resolved.key, resolved.values),
      });
    }
  }

  if (profile.twoFactorEnabled) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted">{t('enabledDescription')}</p>
        </div>

        <p className="text-sm font-medium text-success">{t('statusOn')}</p>

        {!showDisable ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowDisable(true)}
          >
            {t('disable')}
          </Button>
        ) : (
          <form
            onSubmit={disableFormik.handleSubmit}
            className="space-y-4"
            noValidate
          >
            {disableFormik.status?.formError ? (
              <FormError>{disableFormik.status.formError}</FormError>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="2fa-current-password">
                {t('currentPassword')}
              </Label>
              <Input
                id="2fa-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={disableFormik.values.currentPassword}
                onChange={(event) => {
                  if (disableFormik.status?.formError) {
                    disableFormik.setStatus(undefined);
                  }
                  disableFormik.handleChange(event);
                }}
                onBlur={disableFormik.handleBlur}
                hasError={Boolean(
                  disableFormik.touched.currentPassword &&
                    disableFormik.errors.currentPassword,
                )}
              />
              {disableFormik.touched.currentPassword &&
              disableFormik.errors.currentPassword ? (
                <p className="text-xs text-destructive">
                  {disableFormik.errors.currentPassword}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={disableFormik.isSubmitting}>
                {t('confirmDisable')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowDisable(false);
                  disableFormik.resetForm();
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={enableFormik.handleSubmit}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </div>

      <p className="text-sm text-subtle">{t('statusOff')}</p>

      {enableFormik.status?.formError ? (
        <FormError>{enableFormik.status.formError}</FormError>
      ) : null}

      {codeSent ? (
        <div className="space-y-2">
          <Label htmlFor="2fa-enable-code">{t('code')}</Label>
          <Input
            id="2fa-enable-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t('codePlaceholder')}
            value={enableFormik.values.code}
            onChange={(event) => {
              if (enableFormik.status?.formError) {
                enableFormik.setStatus(undefined);
              }
              void enableFormik.setFieldValue(
                'code',
                event.target.value.replace(/\D/g, '').slice(0, 6),
              );
            }}
            onBlur={enableFormik.handleBlur}
            hasError={Boolean(
              enableFormik.touched.code && enableFormik.errors.code,
            )}
          />
          {enableFormik.touched.code && enableFormik.errors.code ? (
            <p className="text-xs text-destructive">{enableFormik.errors.code}</p>
          ) : (
            <p className="text-xs text-subtle">{t('codeHint')}</p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={enableFormik.isSubmitting}>
          {codeSent ? t('confirmEnable') : t('enable')}
        </Button>

        {codeSent ? (
          <button
            type="button"
            disabled={resendSeconds > 0 || requestEnable.isPending}
            onClick={() => void handleResend()}
            className="text-sm font-medium text-link hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            {resendSeconds > 0
              ? t('resendIn', { seconds: resendSeconds })
              : t('resend')}
          </button>
        ) : null}
      </div>
    </form>
  );
}
