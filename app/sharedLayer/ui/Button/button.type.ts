import { ButtonHTMLAttributes } from "react";

export type ButtonProps = {
  type?: 'button' | 'submit' | 'reset'
  variant?: "primary" | "warning" | "outlined" | "clear" ;
  fullWidth?: boolean
  // onClick?: () => void
  onClick?: any
  // size?: "small" | "medium" | "large";
} & ButtonHTMLAttributes<HTMLButtonElement>;
// export type ButtonProps = {
//   type?: 'button' | 'submit' | 'reset'
//   variant?: "primary" | "secondary" | "danger";
//   border?: boolean;
//   fullWidth?: boolean
//   onClick?: () => void
//   size?: "small" | "medium" | "large";
// };
