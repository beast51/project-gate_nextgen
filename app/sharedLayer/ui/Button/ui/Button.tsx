'use client';

import { ButtonProps } from '../button.type';
import cn from 'classnames';
import cls from './Button.module.scss';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  onClick,
  // size = 'medium',
  type = 'button',
  fullWidth,
  children,
  disabled,
  className,
  ...otherProps
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={cn(
        cls.button,
        {
          'full-width': fullWidth,
          disabled: disabled,
        },
        // `size-${size}`,
        `${variant}`,
        className,
      )}
      {...otherProps}
    >
      {children}
    </button>
  );
};

// {
//    <button
// onClick={onClick}
// type={type}
// disabled={disabled}
// className={cn(
//   `
//   flex
//   justify-center
//   rounded-md
//   px-3
//   py-2
//   text-sm
//   font-semibold
//   focus-visible:outline
//   focus-visible:outline-2
//   focus-visible:outline-offset-2
// `,
//   disabled && 'opacity-50 cursor-default',
//   fullWidth && 'w-full',
//   secondary ? 'text-gray-900' : 'text-white',
//   danger &&
//     `
//   bg-rose-500
//   hover:bg-rose-600
//   focus-visible:outline-rose-600
//   `,
//   !secondary &&
//     !danger &&
//     'bg-sky-500 hover:bg-sky-600 focus-visible:outline-sky-600',
//   className,
// )}

// }

// import { classNames } from 'shared/lib/classNames/classNames';
// import cls from './Button.module.scss';
// import { type ButtonHTMLAttributes, type FC } from 'react';

// export enum ThemeButton {
//   CLEAR = 'clear',
//   OUTLINE = 'outline',
// }

// interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//   className?: string;
//   theme?: ThemeButton;
// }

// export const Button: FC<ButtonProps> = (props) => {
//   const {
//     className = '',
//     children,
//     theme = ThemeButton.CLEAR,
//     ...otherProps
//   } = props;

//   return (
//     <button
//       className={classNames(cls.button, {}, [cls[theme], className])}
//       {...otherProps}
//     >
//       {children}
//     </button>
//   );
// };

//2nd var

// 'use client';
// import { Button as MuiButton } from '@mui/material';
// import React, { ButtonHTMLAttributes } from 'react';
// import { ButtonProps } from '../button.type';
// import cn from 'classnames';
// import cls from './Button.module.scss';

// export const Button: React.FC<
//   ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>
// > = ({
//   variant = 'contained',
//   onClick,
//   size = 'large',
//   type,
//   fullWidth,
//   border,
//   children,
//   disabled,
//   className,
//   ...otherProps
// }) => {
//   return (
//     <MuiButton fullWidth variant={variant} size={size} className={cls.button}>
//       {children}
//     </MuiButton>
//   );
//   // <button
//   //   onClick={onClick}
//   //   type={type}
//   //   disabled={disabled}
//   //   className={cn(
//   //     cls.button,
//   //     { 'full-width': fullWidth, border },
//   //     `size-${size}`,
//   //     `variant-${variant}`,
//   //     className,
//   //   )}
//   //   {...otherProps}
//   // >
//   //   {children}
//   // </button>
// };
