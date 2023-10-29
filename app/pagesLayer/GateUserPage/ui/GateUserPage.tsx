import { FC } from 'react';
import classes from './GateUserPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { UploadImageButton } from '@/featuresLayer/UploadImageButton';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await getGateUserFromDb(phoneNumber);

  console.log(user);
  return (
    <div className={classes.gateUsersPage}>
      USER Page
      <p>{user.name}</p>
      <UploadImageButton
        apartmentNumber={user.apartmentNumber}
        carNumber={user.carNumber[0]}
      />
    </div>
  );
};
