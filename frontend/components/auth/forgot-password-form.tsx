'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveAuthErrorKey } from '@/lib/auth-errors';
import { validateEmail } from '@/lib/validation/auth';
import { authService } from '@/services/auth.service';

type ForgotPasswordFormValues = {
  email: string;
};

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tValidation = useTranslations('auth.validation');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: {
      email: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof ForgotPasswordFormValues, string>> =
        {};

      const emailError = validateEmail(values.email);
      if (emailError) {
        errors.email = tValidation(emailError);
      }

      return errors;
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);
      const email = values.email.trim();

      try {
        await authService.forgotPassword({ email });
        setSubmittedEmail(email);
        toast.success(t('messages.password_reset_email_sent'));
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

  if (submittedEmail) {
    return (
      <AuthLayout
        title={t('forgot.successTitle')}
        subtitle={t('forgot.successDescription', { email: submittedEmail })}
        footer={
          <Link
            href="/login"
            className="font-medium text-link hover:underline"
          >
            {t('forgot.backToLogin')}
          </Link>
        }
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <MailCheck className="size-14 text-success" strokeWidth={1.5} />
            <p className="text-sm text-muted">{t('forgot.successHint')}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setSubmittedEmail(null);
                void formik.setFieldValue('email', '');
              }}
            >
              {t('forgot.sendAgain')}
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('forgot.title')}
      subtitle={t('forgot.subtitle')}
      footer={
        <>
          {t('forgot.rememberPassword')}{' '}
          <Link href="/login" className="font-medium text-link hover:underline">
            {t('forgot.backToLogin')}
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

            <Button
              type="submit"
              className="w-full"
              isLoading={formik.isSubmitting}
            >
              {t('forgot.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
