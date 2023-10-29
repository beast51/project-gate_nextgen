import classes from './GateUserCardsList.module.scss';
import { GateUserCard } from '@/entitiesLayer/GateUserCard';
import { getGateUserFromDb } from '../model/getGateUserFromDb';

export const GateUserCardsList = async () => {
  const users = await getGateUserFromDb();
  return (
    <div className={classes.gateUserCardList}>
      {users.map((user) => {
        return <GateUserCard data={user} key={user.phoneNumber} />;
      })}
    </div>
  );
};
