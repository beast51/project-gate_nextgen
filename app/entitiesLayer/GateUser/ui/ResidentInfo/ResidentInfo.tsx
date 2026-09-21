'use client';

import { FC } from 'react';
import { useIntl } from 'react-intl';
import cn from 'classnames';
import { GateUserType } from '../../model/types/GateUser.type';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { Link } from '@/sharedLayer/framework/Link';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { rename } from '@/sharedLayer/utils/rename';
import { CarNumbersList } from '../CarNumbersList/CarNumbersList';
import classes from './ResidentInfo.module.scss';

type ResidentInfoProps = {
  user: GateUserType;
  // everybody of the apartment, the user included; empty for a caller without an apartment
  residents: GateUserType[];
  // false: the photos of the user are shown above, a placeholder is not needed
  withAvatar: boolean;
};

// Who the gate user is: the name, the apartment, the cars and all the phones of the apartment, the opened one first
export const ResidentInfo: FC<ResidentInfoProps> = ({ user, residents, withAvatar }) => {
  const { $t } = useIntl();
  const others = residents.filter((resident) => resident.phoneNumber !== user.phoneNumber);
  const cars = user.carNumber.filter(Boolean);

  return (
    <div className={cn(classes.info, { [classes.withAvatar]: withAvatar })}>
      {withAvatar && <Avatar image={user.image} isSquare isBlackListed={user.isBlackListed} />}

      <div className={classes.details}>
        <div className={classes.head}>
          <p className={classes.name}>{rename(user.name)}</p>
          {user.apartmentNumber && <p className={classes.apartment}>кв. {user.apartmentNumber}</p>}
        </div>

        <p className={classes.phone}>{formatPhoneNumber(user.phoneNumber)}</p>

        {cars.length > 0 && <CarNumbersList carNumber={cars} className={classes.cars} />}

        {others.length > 0 && (
          <div className={classes.others}>
            <p className={classes.label}>{$t({ id: 'resident: phones of the apartment' })}</p>
            <ul className={classes.phones}>
              {others.map((resident) => (
                <li key={resident.phoneNumber}>
                  <Link href={`/users/${resident.phoneNumber}`} className={cn(classes.otherPhone, { [classes.blocked]: resident.isBlackListed })}>
                    {formatPhoneNumber(resident.phoneNumber)}
                    {resident.name && <span className={classes.otherName}> {rename(resident.name)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
