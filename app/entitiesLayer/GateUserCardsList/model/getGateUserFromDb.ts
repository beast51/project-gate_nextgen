import { GateUserType } from "@/entitiesLayer/GateUserCard/GateUserCard.type";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
import prisma from "../../../(appLayer)/libs/prismadb";



export const getGateUserFromDb = async (phoneNumber="") => {
  console.log('ok-1')
  const session = await getSession();
  console.log('ok-2')
  if (!session?.user?.email) {
    return [];
  }
  try {
    const whereClause = phoneNumber ? { phoneNumber } : {};
    const gateUsers = await prisma?.gateUser.findMany({
      where: whereClause
    }) as GateUserType[]
    console.log('Received gate users is: ', gateUsers)
    return gateUsers
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}