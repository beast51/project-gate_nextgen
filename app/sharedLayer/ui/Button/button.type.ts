export type ButtonProps = {
  // variant?: "primary" | "outline" | "soft" | "ghost";
  border?: boolean;
  fullWidth?: boolean
  onClick?: () => void
  // size?: "sm" | "md" | "lg";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "dark"
    | "light";
};
