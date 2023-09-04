import '@/styles/index.scss';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
// import { Inter } from 'next/font/google';
import cn from 'classnames';

// const inter = Inter({ subsets: ['latin'] });
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
      <body className={cn(sfpro.className, 'app')}>{children}</body>
    </html>
  );
}
