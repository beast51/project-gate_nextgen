'use client';

import { ReactNode } from 'react';
import { IntlProvider, MessageFormatElement } from 'react-intl';

export default function ServerIntlProvider({
  messages,
  locale,
  children,
}: {
  messages: Record<string, MessageFormatElement[]> | Record<string, string>;
  locale: string;
  children: ReactNode;
}) {
  return (
    <IntlProvider messages={messages} locale={locale}>
      {children}
    </IntlProvider>
  );
}
