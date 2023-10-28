import { FC } from 'react';
import classes from './GateUserPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { UploadImageButton } from '@/featuresLayer/UploadImageButton';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await getGateUserFromDb(phoneNumber);
  return (
    <div className={classes.gateUsersPage}>
      USERS Page
      <p>{user.name}</p>
      <UploadImageButton />
    </div>
  );
};
