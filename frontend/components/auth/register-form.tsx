'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveAuthErrorKey } from '@/lib/auth-errors';
import {
  validateDisplayName,
  validateEmail,
  validatePasswordConfirmation,
  validateRegisterPassword,
  validateUsername,
} from '@/lib/validation/auth';
import { useAuth } from '@/providers/AuthProvider';

type RegisterFormValues = {
  username: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tValidation = useTranslations('auth.validation');
  const { register } = useAuth();

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      username: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof RegisterFormValues, string>> = {};

      const usernameError = validateUsername(values.username);
      if (usernameError) {
        errors.username = tValidation(usernameError);
      }

      const displayNameError = validateDisplayName(values.displayName);
      if (displayNameError) {
        errors.displayName = tValidation(displayNameError);
      }

      const emailError = validateEmail(values.email);
      if (emailError) {
        errors.email = tValidation(emailError);
      }

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
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await register({
          username: values.username.trim(),
          displayName: values.displayName.trim(),
          email: values.email.trim(),
          password: values.password,
        });
        toast.success(t('register.success'));
        resetForm();
      } catch (error) {
        toast.error(tErrors(resolveAuthErrorKey(error)));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-link hover:underline"
          >
            {t('register.signIn')}
          </Link>
        </>
      }
    >
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">{t('fields.username')}</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder={t('placeholders.username')}
                  value={formik.values.username}
                  onChange={formik.handleChange}
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
                  onChange={formik.handleChange}
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
              <Label htmlFor="email">{t('fields.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('placeholders.email')}
                value={formik.values.email}
                onChange={formik.handleChange}
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
                autoComplete="new-password"
                placeholder={t('placeholders.passwordRegister')}
                value={formik.values.password}
                onChange={formik.handleChange}
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
              <Label htmlFor="confirmPassword">{t('fields.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t('placeholders.confirmPassword')}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
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

            <Button
              type="submit"
              className="w-full"
              isLoading={formik.isSubmitting}
            >
              {t('register.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
