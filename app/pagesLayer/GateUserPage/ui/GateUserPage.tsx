import { FC } from 'react';
import classes from './GateUserPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { Slider } from '@/sharedLayer/ui/Slider';
import { GateUserControlPanel } from '@/featuresLayer/GateUserControlPanel';
import { ImageControlPanel } from '@/featuresLayer/ImageControlPanel';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await getGateUserFromDb(phoneNumber);

  console.log(user);
  return (
    <div className={classes.gateUsersPage}>
      <div>
        <Slider user={user} />
      </div>
      <div className={classes.container}>
        <p>{user.name}</p>
        <p>кв.{user.apartmentNumber}</p>

        <ImageControlPanel
          apartmentNumber={user.apartmentNumber}
          carNumber={user.carNumber[0]}
        />
        <GateUserControlPanel user={user} />
      </div>
    </div>
  );
};
