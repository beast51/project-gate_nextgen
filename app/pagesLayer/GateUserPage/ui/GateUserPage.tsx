import { FC } from 'react';
import classes from './GateUserPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { UploadImageButton } from '@/featuresLayer/UploadImageButton';
import { Slider } from '@/sharedLayer/ui/Slider';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await getGateUserFromDb(phoneNumber);

  console.log(user);
  return (
    <div className={classes.gateUsersPage}>
      <Slider user={user} />
      <div className={classes.container}>
        USER Page
        <p>{user.name}</p>
        <UploadImageButton
          apartmentNumber={user.apartmentNumber}
          carNumber={user.carNumber[0]}
        />
      </div>
    </div>
  );
};
