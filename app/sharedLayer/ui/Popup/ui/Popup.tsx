'use client';

import { Modal } from '@mui/material';
import { ModalProps } from '../Popup.type';
import React from 'react';
import cn from 'classnames';
import classes from './Popup.module.scss';
import { useTheme } from '@/appLayer/providers/ThemeProvider';

const Popup: React.FC<ModalProps> = ({
  className,
  isOpen,
  onClose,
  fullWidth,
  fullHeight,
  children,
}) => {
  const { theme } = useTheme();
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className={`app ${theme}`}
    >
      <div
        className={cn(
          classes.popup,
          {
            [classes.fullWidth]: fullWidth,
            [classes.fullHeight]: fullHeight,
          },
          className,
        )}
      >
        <svg
          onClick={onClose}
          className={classes.icon}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
        >
          <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
        </svg>
        {children}
      </div>
    </Modal>
  );
};

export default Popup;
