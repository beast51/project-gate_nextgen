export type ButtonProps = {
  type?: 'button' | 'submit' | 'reset'
  variant?: "primary" | "secondary" | "danger";
  border?: boolean;
  fullWidth?: boolean
  onClick?: () => void
  size?: "small" | "medium" | "large";
};
