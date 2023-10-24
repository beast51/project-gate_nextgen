import '@/styles/index.scss';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import ThemeProvider from '@/appLayer/providers/ThemeProvider/ui/ThemeProvider';
import { Suspense } from 'react';
import ServerIntlProvider from '@/appLayer/providers/ServerIntlProvider/ui/ServerIntlProvider';
import getIntl from '@/appLayer/providers/ServerIntlProvider/lib/intl';
import { currentLocale } from 'next-i18n-router';
import AuthContext from './(appLayer)/context/AuthContext';
import ToasterContext from './(appLayer)/context/ToasterContext';

export const sfpro = localFont({
  src: [
    {
      path: '../public/fonts/SFPRODISPLAYLIGHTITALIC.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/SFPRODISPLAYREGULAR.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SFPRODISPLAYMEDIUM.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/SFPRODISPLAYBOLD.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Project Gate new version',
  description: 'Made by Beast',
  manifest: '/manifest.json',
  icons: { apple: '/icon.png' },
  themeColor: [
    {
      color: '#F2F1F6',
      media: '(prefers-color-scheme: light)',
    },
    {
      color: '#1f1f1f',
      media: '(prefers-color-scheme: dark)',
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const intl = await getIntl();

  return (
    <html lang={currentLocale()}>
      <body className={sfpro.className}>
        <AuthContext>
          <ToasterContext />
          <Suspense
          // fallback="loading"
          >
            <ServerIntlProvider
              messages={JSON.parse(JSON.stringify(intl.messages))}
              locale={JSON.parse(JSON.stringify(intl.locale))}
            >
              <ThemeProvider>{children}</ThemeProvider>
            </ServerIntlProvider>
          </Suspense>
        </AuthContext>
      </body>
    </html>
  );
}
