import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
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

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-body',
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
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
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
                      '!bg-surface !text-foreground !border !border-border !rounded-[var(--radius-md)] !shadow-[var(--shadow-lg)]',
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
