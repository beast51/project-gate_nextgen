import { signIn } from 'next-auth/react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { FieldValues } from 'react-hook-form';
import toast from 'react-hot-toast';

export const loginUser = (data: FieldValues, router: AppRouterInstance) => {
  signIn('credentials', {
    ...data,
    redirect: false,
  }).then((callback) => {
    if (callback?.error) {
      toast.error('Invalid credentials');
    }
    if (callback?.ok && !callback?.error) {
      toast.success('Success logged in');
      router.push('/users');
    }
  });
};
