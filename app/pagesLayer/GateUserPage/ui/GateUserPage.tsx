import { FC } from 'react';
import classes from './GateUserPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { Slider } from '@/sharedLayer/ui/Slider';
import { GateUserControlPanel } from '@/featuresLayer/GateUserControlPanel';
import { ImageControlPanel } from '@/featuresLayer/ImageControlPanel';
import getSession from '@/widgetsLayer/Sidebar/actions/getSession';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await getGateUserFromDb(phoneNumber);
  const session = await getSession();
  console.log('2222', session?.user?.name);
  const isSpectator = session?.user?.name === 'spectator';
  // const isSpectator = session?.user?.name === 'spectator';

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
        <GateUserControlPanel user={user} isSpectator={isSpectator} />
      </div>
    </div>
  );
};
