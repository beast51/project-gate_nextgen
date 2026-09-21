import NextLink from 'next/link';
import { AnchorHTMLAttributes, FC } from 'react';

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
}

// Client side navigation between pages of the application
export const Link: FC<LinkProps> = (props) => <NextLink {...props} />;
