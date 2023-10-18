'use client';
import cn from 'classnames';
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import cls from './Input.module.scss';

interface InputProps {
  label?: string;
  placeholder?: string;
  id: string;
  type?: string;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
  maxLength?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
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
  disabled,
}) => {
  return (
    <div className={cn(cls.inputWrapper, 'mb32')}>
      {label && (
        <label
          //   className="
          //   block
          //   text-sm
          //   font-medium
          //   leading-6
          //   text-gray-900
          //   mt-2
          // "
          className={cls.label}
          htmlFor={id}
        >
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
          className={cls.input}
          // className={clsx(
          //   `
          //   form-input
          //   w-full
          //   rounded-md
          //   border-0
          //   py-1.5
          //   text-gray-900
          //   shadow-sm
          //   ring-1
          //   ring-inset
          //   ring-gray-300
          //   placeholder:text-gray-400
          //   focus:ring-2
          //   focus:ring-inset
          //   focus:ring-sky-600
          //   sm:text-sm
          //   sm-leading-6`,
          //   errors[id] && 'focus:ring-rose-500',
          //   disabled && 'opacity-50 cursor-default',
          // )}
        />
      </div>
    </div>
  );
};
