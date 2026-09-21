import { GateUserPage } from '@/app/pagesLayer/GateUserPage';

export type UserPropsType = {
  params: Promise<{ phoneNumber: string }>;
};

export default async function User({ params }: UserPropsType) {
  const { phoneNumber } = await params;

  return <GateUserPage phoneNumber={phoneNumber} />;
}
