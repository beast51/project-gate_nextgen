import { FC } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { GateUserDto } from '@/contracts';
import { Button } from '@/sharedLayer/ui/Button';
import { FormInput } from '@/sharedLayer/ui/FormInput';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { parsePlates, platesLine } from './parsePlates';
import classes from './EditGateUserForm.module.scss';

// What an operator may change about a gate user. The phone number is the identity of the user
// (the calls, the penalties and the telephony know them by it): it is shown, not edited.
export type GateUserEdits = Pick<GateUserDto, 'name' | 'carNumber' | 'apartmentNumber'>;

type EditGateUserFormProps = {
  user: GateUserDto;
  isLoading: boolean;
  onSave: (edits: GateUserEdits) => void;
  onBack: () => void;
};

export const EditGateUserForm: FC<EditGateUserFormProps> = ({ user, isLoading, onSave, onBack }) => {
  const { $t } = useIntl();

  const { register, handleSubmit, formState: { errors } } = useForm<FieldValues>({
    defaultValues: {
      name: user.name,
      carNumber: platesLine(user.carNumber),
      apartmentNumber: user.apartmentNumber ?? '',
    },
  });

  const submit: SubmitHandler<FieldValues> = ({ name, carNumber, apartmentNumber }) => {
    onSave({
      name: String(name).trim(),
      carNumber: parsePlates(String(carNumber), user.carNumber),
      apartmentNumber: String(apartmentNumber).trim() || null,
    });
  };

  return (
    <form className={classes.form} onSubmit={handleSubmit(submit)}>
      <p className={classes.title}>{$t({ id: 'edit user: title' })}</p>

      <p className={classes.phone}>{formatPhoneNumber(user.phoneNumber)}</p>
      <p className={classes.note}>{$t({ id: 'edit user: phone note' })}</p>

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
        id="carNumber"
        label={$t({ id: 'vehicle number' })}
        placeholder={$t({ id: 'enter vehicle number' })}
        type="text"
        register={register}
        errors={errors}
        disabled={isLoading}
      />
      <p className={classes.hint}>{$t({ id: 'edit user: plates hint' })}</p>
      <FormInput
        id="apartmentNumber"
        label={$t({ id: 'apartment' })}
        placeholder={$t({ id: 'enter apartment number' })}
        type="text"
        register={register}
        errors={errors}
        disabled={isLoading}
      />

      <div className={classes.actions}>
        <Button fullWidth type="submit" disabled={isLoading}>
          {$t({ id: 'save' })}
        </Button>
        <Button fullWidth disabled={isLoading} onClick={onBack}>
          {$t({ id: 'cancel' })}
        </Button>
      </div>
    </form>
  );
};
