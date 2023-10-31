import classes from './GateUserCardsList.module.scss';
import { GateUserCard } from '@/entitiesLayer/GateUserCard';
import { FC, memo, useEffect, useState } from 'react';
import { GateUserType } from '@/entitiesLayer/GateUserCard/GateUserCard.type';
import { GateUserCardsListType } from '../GateUserCards.type';
import { Pagination } from '@/sharedLayer/ui/Pagination';
import { useIntl } from 'react-intl';

export const GateUserCardsList: FC<GateUserCardsListType> = memo(
  ({ users }) => {
    return (
      <>
        <div className={classes.gateUserCardList}>
          {users.map((user) => {
            return <GateUserCard data={user} key={user.phoneNumber} />;
          })}
        </div>
      </>
    );
  },
);
