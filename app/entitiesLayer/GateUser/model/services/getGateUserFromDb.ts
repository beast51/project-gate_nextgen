
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
// import prisma from "../../../../(appLayer)/libs/prismadb";
import { GateUserType } from "../types/GateUser.type";
import { getPrismaClient } from "@/appLayer/libs/prismadb";



export const getGateUserFromDb = async (phoneNumber="") => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
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