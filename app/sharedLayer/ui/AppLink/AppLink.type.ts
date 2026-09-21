import { LinkProps } from '@/sharedLayer/framework/Link';

// export enum AppLinkVariant {
//   PRIMARY = 'primary',
//   // SECONDARY = 'secondary',
//   // RED = 'red',
// }

export type AppLinkProps = {
  className?: string;
  variant?: 'primary';
  children?: React.ReactNode;
} & LinkProps