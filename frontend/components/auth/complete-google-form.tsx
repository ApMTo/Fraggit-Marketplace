'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { resolveAuthErrorKey } from '@/lib/auth-errors';
import {
  validateDisplayName,
  validateUsername,
} from '@/lib/validation/auth';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';

type CompleteGoogleFormValues = {
  username: string;
  displayName: string;
  acceptedLegal: boolean;
};

type CompleteGoogleFormProps = {
  token: string;
};

const FIELD_ERROR_KEYS: Partial<
  Record<string, keyof CompleteGoogleFormValues>
> = {
  username_already_exists: 'username',
};

export function CompleteGoogleForm({ token }: CompleteGoogleFormProps) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tValidation = useTranslations('auth.validation');
  const { updateUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const formik = useFormik<CompleteGoogleFormValues>({
    initialValues: {
      username: '',
      displayName: '',
      acceptedLegal: false,
    },
    enableReinitialize: true,
    validate: (values) => {
      const errors: Partial<Record<keyof CompleteGoogleFormValues, string>> =
        {};

      const usernameError = validateUsername(values.username);
      if (usernameError) {
        errors.username = tValidation(usernameError);
      }

      const displayNameError = validateDisplayName(values.displayName);
      if (displayNameError) {
        errors.displayName = tValidation(displayNameError);
      }

      if (!values.acceptedLegal) {
        errors.acceptedLegal = t('register.legalConsentRequired');
      }

      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (
      values,
      { setSubmitting, setStatus, setFieldError, setFieldTouched },
    ) => {
      setStatus(undefined);

      try {
        const response = await authService.completeGoogle({
          token,
          username: values.username.trim(),
          displayName: values.displayName.trim(),
          acceptedTerms: true,
          acceptedPrivacy: true,
        });
        updateUser(response.user);
        toast.success(t('completeGoogle.success'));
        router.replace('/');
        router.refresh();
      } catch (error) {
        const key = resolveAuthErrorKey(error);
        const message = tErrors(key);
        const field = FIELD_ERROR_KEYS[key];

        if (field) {
          setFieldError(field, message);
          void setFieldTouched(field, true, false);
        } else {
          setStatus({ formError: message });
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPending() {
      try {
        const pending = await authService.getGooglePending(token);
        if (cancelled) {
          return;
        }
        setEmail(pending.email);
        void formik.setFieldValue(
          'displayName',
          pending.suggestedDisplayName || '',
        );
      } catch (error) {
        if (!cancelled) {
          setLoadError(tErrors(resolveAuthErrorKey(error)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPending();

    return () => {
      cancelled = true;
    };
    // formik identity is unstable; only re-run when token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tErrors]);

  if (loading) {
    return (
      <AuthLayout
        title={t('completeGoogle.title')}
        subtitle={t('completeGoogle.subtitle')}
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Spinner size="lg" />
            <p className="text-sm text-subtle">{t('completeGoogle.loading')}</p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (loadError || !email) {
    return (
      <AuthLayout
        title={t('completeGoogle.title')}
        subtitle={t('completeGoogle.subtitle')}
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <FormError>{loadError ?? tErrors('invalid_or_expired_token')}</FormError>
            <Button onClick={() => router.push('/register')}>
              {t('completeGoogle.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  const clearFormError = () => {
    if (formik.status?.formError) {
      formik.setStatus(undefined);
    }
  };

  return (
    <AuthLayout
      title={t('completeGoogle.title')}
      subtitle={t('completeGoogle.subtitle')}
      footer={
        <>
          {t('completeGoogle.hasAccount')}{' '}
          <Link href="/login" className="font-medium text-link hover:underline">
            {t('completeGoogle.signIn')}
          </Link>
        </>
      }
    >
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            {formik.status?.formError ? (
              <FormError>{formik.status.formError}</FormError>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="google-email">{t('fields.email')}</Label>
              <Input
                id="google-email"
                type="email"
                value={email}
                disabled
                readOnly
              />
              <p className="text-xs text-subtle">
                {t('completeGoogle.emailHint')}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">{t('fields.username')}</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder={t('placeholders.username')}
                  value={formik.values.username}
                  onChange={(event) => {
                    clearFormError();
                    formik.handleChange(event);
                  }}
                  onBlur={formik.handleBlur}
                  hasError={Boolean(
                    formik.touched.username && formik.errors.username,
                  )}
                />
                {formik.touched.username && formik.errors.username ? (
                  <p className="text-xs text-destructive">
                    {formik.errors.username}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t('fields.displayName')}</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  autoComplete="name"
                  placeholder={t('placeholders.displayName')}
                  value={formik.values.displayName}
                  onChange={(event) => {
                    clearFormError();
                    formik.handleChange(event);
                  }}
                  onBlur={formik.handleBlur}
                  hasError={Boolean(
                    formik.touched.displayName && formik.errors.displayName,
                  )}
                />
                {formik.touched.displayName && formik.errors.displayName ? (
                  <p className="text-xs text-destructive">
                    {formik.errors.displayName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acceptedLegal"
                  name="acceptedLegal"
                  checked={formik.values.acceptedLegal}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  hasError={Boolean(
                    formik.touched.acceptedLegal && formik.errors.acceptedLegal,
                  )}
                />
                <label
                  htmlFor="acceptedLegal"
                  className="text-sm leading-relaxed text-muted"
                >
                  {t('register.legalConsentPrefix')}{' '}
                  <Link href="/terms" className="text-link hover:underline">
                    {t('register.legalTermsLink')}
                  </Link>
                  ,{' '}
                  <Link href="/privacy" className="text-link hover:underline">
                    {t('register.legalPrivacyLink')}
                  </Link>{' '}
                  {t('register.legalConsentAnd')}{' '}
                  <Link
                    href="/marketplace-rules"
                    className="text-link hover:underline"
                  >
                    {t('register.legalMarketplaceLink')}
                  </Link>
                </label>
              </div>
              {formik.touched.acceptedLegal && formik.errors.acceptedLegal ? (
                <p className="text-xs text-destructive">
                  {formik.errors.acceptedLegal}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={formik.isSubmitting}
            >
              {t('completeGoogle.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
