'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { resolveAuthErrorKey } from '@/lib/auth-errors';
import {
  validatePasswordConfirmation,
  validateRegisterPassword,
} from '@/lib/validation/auth';
import { authService } from '@/services/auth.service';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type ResetPasswordFormProps = {
  token: string;
};

type TokenState = 'loading' | 'valid' | 'invalid' | 'success';

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tValidation = useTranslations('auth.validation');
  const router = useRouter();
  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const hasValidated = useRef(false);

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof ResetPasswordFormValues, string>> = {};

      const passwordError = validateRegisterPassword(values.password);
      if (passwordError) {
        errors.password = tValidation(passwordError);
      }

      const confirmError = validatePasswordConfirmation(
        values.password,
        values.confirmPassword,
      );
      if (confirmError) {
        errors.confirmPassword = tValidation(confirmError);
      }

      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        await authService.resetPassword({
          token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        });
        setTokenState('success');
        toast.success(t('messages.password_reset_success'));
      } catch (error) {
        const key = resolveAuthErrorKey(error);
        if (key === 'invalid_or_expired_token') {
          setTokenState('invalid');
        } else {
          setStatus({ formError: tErrors(key) });
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (hasValidated.current) {
      return;
    }

    hasValidated.current = true;

    async function validateToken() {
      try {
        await authService.validateResetToken(token);
        setTokenState('valid');
      } catch {
        setTokenState('invalid');
      }
    }

    void validateToken();
  }, [token]);

  const clearFormError = () => {
    if (formik.status?.formError) {
      formik.setStatus(undefined);
    }
  };

  if (tokenState === 'loading') {
    return (
      <AuthLayout title={t('reset.title')} subtitle={t('reset.subtitle')}>
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <Spinner size="lg" />
            <p className="text-sm text-subtle">{t('reset.validating')}</p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <AuthLayout title={t('reset.title')} subtitle={t('reset.subtitle')}>
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <XCircle className="size-14 text-destructive" strokeWidth={1.5} />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {t('reset.errorTitle')}
              </p>
              <p className="text-sm text-muted">{t('reset.errorDescription')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push('/forgot-password')}
              >
                {t('reset.requestNew')}
              </Button>
              <Button onClick={() => router.push('/login')}>
                {t('reset.backToLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (tokenState === 'success') {
    return (
      <AuthLayout title={t('reset.title')} subtitle={t('reset.subtitle')}>
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <CheckCircle2 className="size-14 text-success" strokeWidth={1.5} />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {t('reset.successTitle')}
              </p>
              <p className="text-sm text-muted">
                {t('reset.successDescription')}
              </p>
            </div>
            <Button
              onClick={() => {
                router.push('/login');
                router.refresh();
              }}
            >
              {t('reset.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('reset.title')}
      subtitle={t('reset.subtitle')}
      footer={
        <Link href="/login" className="font-medium text-link hover:underline">
          {t('reset.backToLogin')}
        </Link>
      }
    >
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
            {formik.status?.formError ? (
              <FormError>{formik.status.formError}</FormError>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="password">{t('fields.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={t('placeholders.passwordRegister')}
                value={formik.values.password}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(
                  formik.touched.password && formik.errors.password,
                )}
              />
              {formik.touched.password && formik.errors.password ? (
                <p className="text-xs text-destructive">
                  {formik.errors.password}
                </p>
              ) : (
                <p className="text-xs text-subtle">{t('register.passwordHint')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('fields.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t('placeholders.confirmPassword')}
                value={formik.values.confirmPassword}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(
                  formik.touched.confirmPassword &&
                    formik.errors.confirmPassword,
                )}
              />
              {formik.touched.confirmPassword &&
              formik.errors.confirmPassword ? (
                <p className="text-xs text-destructive">
                  {formik.errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={formik.isSubmitting}
            >
              {t('reset.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
