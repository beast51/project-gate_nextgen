'use client';

import { useCallback, useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import classes from './FormWrapper.module.scss';
import { Button } from '@/sharedLayer/ui/Button';
import { Input } from '@/sharedLayer/ui/Input';
import { useIntl } from 'react-intl';
import { registerUser } from '../model/registerUser';
import { loginUser } from '../model/loginUser';
import { Variant } from '../authForm.type';
import { FormInput } from '@/sharedLayer/ui/FormInput';

export const AuthForm = () => {
  const { $t } = useIntl();
  const session = useSession();
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.status === 'authenticated') {
      router.push('/users');
    }
  }, [session?.status, router]);

  const toggleVariant = useCallback(() => {
    if (variant === 'LOGIN') {
      setVariant('REGISTER');
    } else {
      setVariant('LOGIN');
    }
  }, [variant]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      carNumber: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    if (variant === 'REGISTER') {
      registerUser(data);
    }

    if (variant === 'LOGIN') {
      loginUser(data, router);
    }

    setIsLoading(false);
  };

  return (
    <div className={classes.formWrapper}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="phoneNumber"
          label={$t({ id: 'Phone number' })}
          type="phone"
          register={register}
          errors={errors}
          disabled={isLoading}
        />
        {variant === 'REGISTER' && (
          <>
            <FormInput
              id="name"
              label="Name"
              register={register}
              errors={errors}
              disabled={isLoading}
            />
            <FormInput
              id="email"
              label="Email"
              type="email"
              register={register}
              errors={errors}
              disabled={isLoading}
            />
            <FormInput
              id="carNumber"
              label="Car number"
              type="text"
              register={register}
              errors={errors}
              disabled={isLoading}
            />
          </>
        )}

        <FormInput
          id="password"
          label={$t({ id: 'Password' })}
          type="password"
          register={register}
          errors={errors}
          disabled={isLoading}
        />
        <Button disabled={isLoading} fullWidth type="submit" variant="primary">
          {variant === 'LOGIN' ? $t({ id: 'Sign in' }) : $t({ id: 'Register' })}
        </Button>
      </form>
    </div>
  );
};
