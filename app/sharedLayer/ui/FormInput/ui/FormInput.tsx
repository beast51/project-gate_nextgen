'use client';
import cn from 'classnames';
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import classes from './FormInput.module.scss';

interface FormInputProps {
  label?: string;
  value?: string;
  placeholder?: string;
  id: string;
  type?: string;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors?: FieldErrors;
  maxLength?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  id,
  type,
  required,
  register,
  errors,
  maxLength,
  onKeyDown,
  disabled,
}) => {
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
          type={type}
          autoComplete={id}
          disabled={disabled}
          maxLength={maxLength}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          {...register(id, { required })}
          className={classes.input}
        />
      </div>
    </div>
  );
};
