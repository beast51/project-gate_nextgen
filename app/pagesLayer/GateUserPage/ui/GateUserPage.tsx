import { FC } from 'react';
import classes from './GateUserPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { UploadImageButton } from '@/featuresLayer/UploadImageButton';
import { Button } from '@/sharedLayer/ui/Button';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await getGateUserFromDb(phoneNumber);

  console.log(user);
  return (
    <div className={classes.gateUsersPage}>
      USERS Page
      <p>{user.name}</p>
      <UploadImageButton
        apartmentNumber={user.apartmentNumber}
        carNumber={user.carNumber[0]}
      />
    </div>
  );
};
