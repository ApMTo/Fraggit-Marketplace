'use client';

import Link from 'next/link';
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

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tValidation = useTranslations('auth.validation');
  const { login } = useAuth();
  const router = useRouter();

  const formik = useFormik<LoginFormValues>({
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
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        await login({
          email: values.email.trim(),
          password: values.password,
        });
        toast.success(t('login.success'));
        router.replace('/dashboard');
        router.refresh();
      } catch (error) {
        setStatus({ formError: tErrors(resolveAuthErrorKey(error)) });
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
          <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
            {formik.status?.formError ? (
              <FormError>{formik.status.formError}</FormError>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">{t('fields.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('placeholders.email')}
                value={formik.values.email}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(formik.touched.email && formik.errors.email)}
              />
              {formik.touched.email && formik.errors.email ? (
                <p className="text-xs text-destructive">{formik.errors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('fields.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('placeholders.password')}
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
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={formik.isSubmitting}
            >
              {t('login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
