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
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveAuthErrorKey } from '@/lib/auth-errors';
import { validateEmail, validateLoginPassword } from '@/lib/validation/auth';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { isTwoFactorChallenge } from '@/types/auth';

type LoginFormValues = {
  email: string;
  password: string;
};

type TwoFactorFormValues = {
  code: string;
};

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tValidation = useTranslations('auth.validation');
  const { login, verifyTwoFactor } = useAuth();
  const router = useRouter();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendPending, setResendPending] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const loginFormik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginFormValues, string>> = {};

      const emailError = validateEmail(values.email);
      if (emailError) {
        errors.email = tValidation(emailError);
      }

      const passwordError = validateLoginPassword(values.password);
      if (passwordError) {
        errors.password = tValidation(passwordError);
      }

      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        const result = await login({
          email: values.email.trim(),
          password: values.password,
        });

        if (isTwoFactorChallenge(result)) {
          setChallengeId(result.challengeId);
          setResendSeconds(result.resendAvailableInSeconds || 30);
          toast.success(t('twoFactor.codeSent'));
          return;
        }

        toast.success(t('login.success'));
        router.replace(redirectTo);
        router.refresh();
      } catch (error) {
        setStatus({ formError: tErrors(resolveAuthErrorKey(error)) });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const twoFactorFormik = useFormik<TwoFactorFormValues>({
    initialValues: { code: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof TwoFactorFormValues, string>> = {};
      if (!/^\d{6}$/.test(values.code.trim())) {
        errors.code = t('twoFactor.invalidCode');
      }
      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      if (!challengeId) {
        return;
      }

      setStatus(undefined);

      try {
        await verifyTwoFactor({
          challengeId,
          code: values.code.trim(),
        });
        toast.success(t('login.success'));
        router.replace(redirectTo);
        router.refresh();
      } catch (error) {
        setStatus({ formError: tErrors(resolveAuthErrorKey(error)) });
      } finally {
        setSubmitting(false);
      }
    },
  });

  async function handleResend() {
    if (!challengeId || resendSeconds > 0 || resendPending) {
      return;
    }

    setResendPending(true);
    twoFactorFormik.setStatus(undefined);

    try {
      const result = await authService.resendTwoFactor({ challengeId });
      setResendSeconds(result.resendAvailableInSeconds || 30);
      toast.success(t('twoFactor.codeSent'));
    } catch (error) {
      const key = resolveAuthErrorKey(error);
      if (key === 'two_factor_resend_cooldown') {
        setResendSeconds(30);
      }
      twoFactorFormik.setStatus({
        formError: tErrors(key),
      });
    } finally {
      setResendPending(false);
    }
  }

  const clearLoginError = () => {
    if (loginFormik.status?.formError) {
      loginFormik.setStatus(undefined);
    }
  };

  const clearTwoFactorError = () => {
    if (twoFactorFormik.status?.formError) {
      twoFactorFormik.setStatus(undefined);
    }
  };

  if (challengeId) {
    return (
      <AuthLayout
        title={t('twoFactor.title')}
        subtitle={t('twoFactor.subtitle')}
        footer={
          <button
            type="button"
            className="font-medium text-link hover:underline"
            onClick={() => {
              setChallengeId(null);
              void twoFactorFormik.setFieldValue('code', '');
              twoFactorFormik.setStatus(undefined);
            }}
          >
            {t('twoFactor.backToLogin')}
          </button>
        }
      >
        <Card>
          <CardContent>
            <form
              onSubmit={twoFactorFormik.handleSubmit}
              className="space-y-5"
              noValidate
            >
              {twoFactorFormik.status?.formError ? (
                <FormError>{twoFactorFormik.status.formError}</FormError>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="two-factor-code">{t('twoFactor.code')}</Label>
                <Input
                  id="two-factor-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t('twoFactor.codePlaceholder')}
                  value={twoFactorFormik.values.code}
                  onChange={(event) => {
                    clearTwoFactorError();
                    void twoFactorFormik.setFieldValue(
                      'code',
                      event.target.value.replace(/\D/g, '').slice(0, 6),
                    );
                  }}
                  onBlur={twoFactorFormik.handleBlur}
                  hasError={Boolean(
                    twoFactorFormik.touched.code && twoFactorFormik.errors.code,
                  )}
                />
                {twoFactorFormik.touched.code && twoFactorFormik.errors.code ? (
                  <p className="text-xs text-destructive">
                    {twoFactorFormik.errors.code}
                  </p>
                ) : (
                  <p className="text-xs text-subtle">{t('twoFactor.codeHint')}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={twoFactorFormik.isSubmitting}
              >
                {t('twoFactor.submit')}
              </Button>

              <p className="text-center text-sm text-subtle">
                {t('twoFactor.noCode')}{' '}
                <button
                  type="button"
                  disabled={resendSeconds > 0 || resendPending}
                  onClick={() => void handleResend()}
                  className="font-medium text-link hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  {resendSeconds > 0
                    ? t('twoFactor.resendIn', { seconds: resendSeconds })
                    : t('twoFactor.resend')}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-link hover:underline"
          >
            {t('login.createAccount')}
          </Link>
        </>
      }
    >
      <Card>
        <CardContent>
          <form
            onSubmit={loginFormik.handleSubmit}
            className="space-y-5"
            noValidate
          >
            {loginFormik.status?.formError ? (
              <FormError>{loginFormik.status.formError}</FormError>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">{t('fields.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('placeholders.email')}
                value={loginFormik.values.email}
                onChange={(event) => {
                  clearLoginError();
                  loginFormik.handleChange(event);
                }}
                onBlur={loginFormik.handleBlur}
                hasError={Boolean(
                  loginFormik.touched.email && loginFormik.errors.email,
                )}
              />
              {loginFormik.touched.email && loginFormik.errors.email ? (
                <p className="text-xs text-destructive">
                  {loginFormik.errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">{t('fields.password')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-link hover:underline"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('placeholders.password')}
                value={loginFormik.values.password}
                onChange={(event) => {
                  clearLoginError();
                  loginFormik.handleChange(event);
                }}
                onBlur={loginFormik.handleBlur}
                hasError={Boolean(
                  loginFormik.touched.password && loginFormik.errors.password,
                )}
              />
              {loginFormik.touched.password && loginFormik.errors.password ? (
                <p className="text-xs text-destructive">
                  {loginFormik.errors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={loginFormik.isSubmitting}
            >
              {t('login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
