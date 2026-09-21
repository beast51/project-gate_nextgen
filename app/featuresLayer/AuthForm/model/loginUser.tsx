import { AppRouter } from '@/sharedLayer/framework/navigation';
import { PhoneCredentials, signInWithPhone } from '@/sharedLayer/framework/session';
import { FieldValues } from 'react-hook-form';
import toast from 'react-hot-toast';

export const loginUser = (data: FieldValues, router: AppRouter) => {
  signInWithPhone(data as PhoneCredentials).then((result) => {
    if (result.error) {
      toast.error('Invalid credentials');
    }
    if (result.ok) {
      toast.success('Success logged in');
      router.push('/users');
    }
  });
};
