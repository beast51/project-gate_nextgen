'use client';

import axios from 'axios';
import classes from './AddGateUserForm.module.scss';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/sharedLayer/ui/Button';
import { FormInput } from '@/sharedLayer/ui/FormInput';
import { useIntl } from 'react-intl';

export const AddGateUserForm = ({ isSpectator }: { isSpectator?: boolean }) => {
  const { $t } = useIntl();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      phoneNumber: '',
      carNumber: '',
      apartmentNumber: '',
    },
  });

  const phoneNumber = watch('phoneNumber', '');

  useEffect(() => {
    if (
      phoneNumber.length > 0 &&
      !phoneNumber.startsWith('38') &&
      phoneNumber.length <= 9
    ) {
      setValue('phoneNumber', '38' + phoneNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);
    axios
      .post('/api/users/add_user', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(() => console.log('data', data))
      .catch(() => toast.error($t({ id: 'something went wrong' })))
      .finally(() => {
        setIsLoading(false);
        toast.success($t({ id: 'user added successful' }));
        reset();
      });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/[0-9]/.test(event.key) &&
      ![
        'Backspace',
        'Delete',
        'Enter',
        'Tab',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(event.key)
    ) {
      event.preventDefault();
    }
  };

  return (
    <div className={classes.formWrapper}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="name"
          label={$t({ id: 'name' })}
          placeholder={$t({ id: 'enter name' })}
          register={register}
          errors={errors}
          disabled={isLoading}
          required
        />
        <FormInput
          id="phoneNumber"
          label={$t({ id: 'phonenumber' })}
          placeholder={$t({ id: 'enter phonenumber' })}
          type="phone"
          register={register}
          errors={errors}
          disabled={isLoading}
          maxLength={12}
          onKeyDown={handleKeyDown}
          required
        />
        <FormInput
          id="carNumber"
          label={$t({ id: 'vehicle number' })}
          placeholder={$t({ id: 'enter vehicle number' })}
          type="text"
          register={register}
          errors={errors}
          disabled={isLoading}
        />
        <FormInput
          id="apartmentNumber"
          label={$t({ id: 'apartment' })}
          placeholder={$t({ id: 'enter apartment number' })}
          type="text"
          register={register}
          errors={errors}
          disabled={isLoading}
          required
        />
        <Button disabled={isLoading || isSpectator} fullWidth type="submit">
          {$t({ id: 'add user' })}
        </Button>
      </form>
    </div>
  );
};
