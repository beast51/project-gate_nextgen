'use client';

import axios from 'axios';

import { useCallback, useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import AuthSocialButton from '../../AuthSocialButton/AuthSocialButton';
// import { BsGithub, BsGoogle } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import cls from './FormWrapper.module.scss';
import { Button } from '@/sharedLayer/ui/Button';
import { Input } from '@/sharedLayer/ui/Input';
import { useIntl } from 'react-intl';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
// import Button from '@/components/Button/Button';

type Variant = 'LOGIN' | 'REGISTER';

export const AuthForm = () => {
  const { $t } = useIntl();
  const session = useSession();
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.status === 'authenticated') {
      router.push('/users');
      // console.log('Authenticated');
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
      axios
        .post('/api/register', data, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(() => signIn('credentials', data))
        .catch(() => toast.error('Something went wrong'))
        .finally(() => setIsLoading(false));
    }

    if (variant === 'LOGIN') {
      signIn('credentials', {
        ...data,
        redirect: false,
      })
        .then((callback) => {
          if (callback?.error) {
            toast.error('Invalid credentials');
          }
          if (callback?.ok && !callback?.error) {
            toast.success('Success logged in');
            router.push('/users');
          }
        })
        .finally(() => setIsLoading(false));
    }
  };

  const socialAction = (action: string) => {
    setIsLoading(true);

    //NextAuth Sign In
  };

  return (
    <div className={cls.formWrapper}>
      <div
        className="
        bg-white
        px-4
        py-8
        shadow
        sm:rounded-lg
        sm:px-10
      "
      >
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="phoneNumber"
            label={$t({ id: 'Phone number' })}
            type="phone"
            register={register}
            errors={errors}
            disabled={isLoading}
          />
          {variant === 'REGISTER' && (
            <>
              <Input
                id="name"
                label="Name"
                register={register}
                errors={errors}
                disabled={isLoading}
              />
              <Input
                id="email"
                label="Email"
                type="email"
                register={register}
                errors={errors}
                disabled={isLoading}
              />
              <Input
                id="carNumber"
                label="Car number"
                type="text"
                register={register}
                errors={errors}
                disabled={isLoading}
              />
            </>
          )}

          <Input
            id="password"
            label={$t({ id: 'Password' })}
            type="password"
            register={register}
            errors={errors}
            disabled={isLoading}
          />
          <Button disabled={isLoading} fullWidth type="submit">
            {variant === 'LOGIN'
              ? $t({ id: 'Sign in' })
              : $t({ id: 'Register' })}
          </Button>
        </form>

        {/* <div className="mt-6">
          <div className="relative">
            <div
              className="
                absolute 
                inset-0 
                flex 
                items-center
              "
            >
              <div
                className="
                w-full 
                border-t 
              border-gray-300
              "
              />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <AuthSocialButton
            icon={BsGithub}
            onClick={() => socialAction('github')}
          />
          <AuthSocialButton
            icon={BsGoogle}
            onClick={() => socialAction('google')}
          />
        </div>

        <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
          <div>
            {variant === 'LOGIN' ? 'New user?' : 'Already have account'}
          </div>
          <div onClick={toggleVariant} className="underline cursor-pointer">
            {variant === 'LOGIN' ? 'Create an account' : 'Login'}
          </div>
        </div> */}
      </div>
    </div>
  );
};

// export default AuthForm;
