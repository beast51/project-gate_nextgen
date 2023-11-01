'use client';
import cn from 'classnames';
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import cls from './Input.module.scss';
import { ChangeEvent } from 'react';

interface InputProps {
  label?: string;
  value?: string;
  placeholder?: string;
  id?: string;
  type?: string;
  required?: boolean;
  register?: UseFormRegister<FieldValues>;
  errors?: FieldErrors;
  maxLength?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  id,
  type,
  required,
  register,
  errors,
  maxLength,
  onKeyDown,
  onChange,
  disabled,
}) => {
  return (
    <div className={cn(cls.inputWrapper)}>
      {label && (
        <label className={cls.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div>
        <input
          id={id}
          type={type}
          autoComplete={id}
          disabled={disabled}
          maxLength={maxLength}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          {...(register && id ? register(id, { required }) : {})}
          className={cls.input}
          onChange={onChange}
        />
      </div>
    </div>
  );
};
