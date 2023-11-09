'use client';

import axios from 'axios';
import classes from './AddGateUserForm.module.scss';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/sharedLayer/ui/Button';
import { FormInput } from '@/sharedLayer/ui/FormInput';

export const AddGateUserForm = () => {
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

    // console.log(data);
    // setIsLoading(false);
    axios
      .post('/api/users/add_user', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(() => console.log('data', data))
      .catch(() => toast.error('Something went wrong'))
      .finally(() => {
        setIsLoading(false);
        toast.success('User added successful');
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
          label="Name"
          placeholder="Enter name"
          register={register}
          errors={errors}
          disabled={isLoading}
          required
        />
        <FormInput
          id="phoneNumber"
          label="Phone number"
          placeholder="Enter phone number"
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
          label="Car number"
          placeholder="Enter car number"
          type="text"
          register={register}
          errors={errors}
          disabled={isLoading}
        />
        <FormInput
          id="apartmentNumber"
          label="Apartment"
          placeholder="Enter apartment number"
          type="text"
          register={register}
          errors={errors}
          disabled={isLoading}
          required
        />
        <Button disabled={isLoading} fullWidth type="submit">
          Add user
        </Button>
      </form>
    </div>
  );
};
