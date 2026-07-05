'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { resolveAuthErrorKey } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';

type VerifyEmailFormProps = {
  token: string;
};

type VerifyState = 'loading' | 'success' | 'error';

export function VerifyEmailForm({ token }: VerifyEmailFormProps) {
  const t = useTranslations('auth.verify');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const { updateUser } = useAuth();
  const [state, setState] = useState<VerifyState>('loading');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    async function verifyEmail() {
      try {
        const response = await authService.verify(token);
        updateUser(response.user);
        setState('success');
        toast.success(t('success'));
      } catch (error) {
        setState('error');
        toast.error(tErrors(resolveAuthErrorKey(error)));
      }
    }

    void verifyEmail();
  }, [token, updateUser, t, tErrors]);

  return (
    <AuthLayout title={t('title')} subtitle={t('subtitle')}>
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
          {state === 'loading' ? (
            <>
              <Spinner size="lg" />
              <p className="text-sm text-subtle">{t('loading')}</p>
            </>
          ) : null}

          {state === 'success' ? (
            <>
              <CheckCircle2 className="size-14 text-success" strokeWidth={1.5} />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {t('successTitle')}
                </p>
                <p className="text-sm text-muted">{t('successDescription')}</p>
              </div>
              <Button
                onClick={() => {
                  router.push('/dashboard');
                  router.refresh();
                }}
              >
                {t('goToDashboard')}
              </Button>
            </>
          ) : null}

          {state === 'error' ? (
            <>
              <XCircle className="size-14 text-destructive" strokeWidth={1.5} />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {t('errorTitle')}
                </p>
                <p className="text-sm text-muted">{t('errorDescription')}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" onClick={() => router.push('/register')}>
                  {t('tryAgain')}
                </Button>
                <Button onClick={() => router.push('/login')}>
                  {t('goToLogin')}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
