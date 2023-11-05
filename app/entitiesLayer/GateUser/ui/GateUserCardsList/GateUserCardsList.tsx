import classes from './GateUserCardsList.module.scss';

import { FC, memo, useEffect, useState } from 'react';

import React from 'react';
import { GateUserCard } from '../GateUserCard/GateUserCard';
import { GateUserCardsListType } from '../../model/types/GateUser.type';

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
