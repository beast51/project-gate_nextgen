import { FC } from 'react';
import cn from 'classnames';
import classes from './GateUserPage.module.scss';
import { loadGateUsers, loadGateUsersOfApartment } from '../../lib/loadGateUsers';
import { Slider } from '@/sharedLayer/ui/Slider';
import { GateUserControlPanel } from '@/featuresLayer/GateUserControlPanel';
import { ImageControlPanel } from '@/featuresLayer/ImageControlPanel';
import { ResidentInfo } from '@/entitiesLayer/GateUser';
import { ResidentHistory } from '@/widgetsLayer/ResidentHistory';

export type GateUserPageProps = {
  phoneNumber: string;
};

export const GateUserPage: FC<GateUserPageProps> = async ({ phoneNumber }) => {
  const [user] = await loadGateUsers(phoneNumber);

  // the user was removed, or the visitor has no session (the proxy sends them to the sign in form)
  if (!user) return null;

  // a penalty and the violations belong to the apartment: the page shows all of it, whoever was opened
  const residents = user.apartmentNumber ? await loadGateUsersOfApartment(user.apartmentNumber) : [];
  const hasPhotos = Boolean(user.image) || Boolean(user.additionalImages?.length);

  return (
    <div className={cn(classes.gateUsersPage, { [classes.withoutPhotos]: !hasPhotos })}>
      {hasPhotos && (
        <div>
          <Slider user={user} />
        </div>
      )}
      <div className={classes.container}>
        <ResidentInfo user={user} residents={residents} withAvatar={!hasPhotos} />
        <ImageControlPanel
          apartmentNumber={user.apartmentNumber}
          carNumber={user.carNumber[0]}
        />
        <GateUserControlPanel user={user} />
        {/* the same key the violations are counted by: the apartment or, without one, the phone number */}
        <ResidentHistory subject={user.apartmentNumber || user.phoneNumber} />
      </div>
    </div>
  );
};
