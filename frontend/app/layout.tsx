import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from 'react-hot-toast';
import { AppShell } from '@/components/layout/app-shell';
import { getSessionUser } from '@/lib/auth.server';
import { getTheme } from '@/lib/theme.server';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { IntlProvider } from '@/providers/IntlProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fraggit',
  description: 'Fraggit marketplace',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const initialUser = await getSessionUser();
  const theme = await getTheme();

  return (
    <html
      lang={locale}
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <IntlProvider locale={locale} messages={messages}>
          <QueryProvider>
            <ThemeProvider theme={theme}>
              <AuthProvider initialUser={initialUser}>
                <AppShell>{children}</AppShell>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className:
                      '!bg-surface !text-foreground !border !border-border',
                  }}
                />
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
