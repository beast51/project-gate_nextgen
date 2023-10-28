import { GateUserPage } from '@/app/pagesLayer/GateUserPage';
import { FC } from 'react';

export type UserPropsType = {
  params: { phoneNumber: string };
};

const User: FC<UserPropsType> = ({ params: { phoneNumber } }) => {
  return <GateUserPage phoneNumber={phoneNumber} />;
};

export default User;
