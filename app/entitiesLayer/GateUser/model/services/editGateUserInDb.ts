import { getPrismaClient } from "@/appLayer/libs/prismadb";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
// import prisma from '@/appLayer/libs/prismadb'

export const editGateUserInDb = async (data: {
  idInApi?: string,
  name?: string,
  phoneNumber: string,
  carNumber?: string[],
  apartmentNumber?: string,
  image?: string,
  isBlackListed?: boolean,
  blackListedFrom?: string,
  blackListedTo?: string,
}) => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma?.gateUser.update({
    where: {
      phoneNumber: data.phoneNumber,
    },
    data,
  });
  console.log('user is now: ', user)
}