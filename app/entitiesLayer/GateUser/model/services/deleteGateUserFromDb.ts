import { getPrismaClient } from "@/appLayer/libs/prismadb";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
// import prisma from '@/appLayer/libs/prismadb'

export const deleteGateUserFromDb = async (phoneNumber: string) => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {

    await prisma?.gateUser.delete({
      where: {
        phoneNumber: phoneNumber,
      }
    }) 

    console.log(`User with phoneNumber: ${phoneNumber} deleted`)
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}