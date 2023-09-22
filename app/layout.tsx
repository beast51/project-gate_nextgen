import '@/styles/index.scss';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import ThemeProvider from './(appLayer)/providers/ThemeProvider/ui/ThemeProvider';
import { Suspense } from 'react';
import I18nProvider from '@/appLayerproviders/I18nProvider/ui/I18nProvider';

const sfpro = localFont({
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
  themeColor: '#fff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={sfpro.className}>
        <Suspense fallback="loading">
          <I18nProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </I18nProvider>
        </Suspense>
      </body>
    </html>
  );
}
