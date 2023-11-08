'use client';
import cn from 'classnames';
import { FieldErrors } from 'react-hook-form';
import classes from './Input.module.scss';
import { ChangeEvent, useId } from 'react';

interface InputProps {
  label?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  errors?: FieldErrors;
  maxLength?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  required,
  errors,
  maxLength,
  onKeyDown,
  onChange,
  disabled,
}) => {
  const id = useId();
  return (
    <div className={cn(classes.inputWrapper)}>
      {label && (
        <label className={classes.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div>
        <input
          id={id}
          disabled={disabled}
          maxLength={maxLength}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={classes.input}
          onChange={onChange}
          required={required}
        />
      </div>
    </div>
  );
};
