import { ReactNode } from "react";

export type ModalProps = {
  className?: string;
  onClose: () => void;
  isOpen: boolean;
  children: ReactNode;
  fullWidth?: boolean;
  fullHeight?: boolean;
  isSpectator?: boolean
}