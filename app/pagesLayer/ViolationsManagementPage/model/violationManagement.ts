import { getPrismaClient } from "@/appLayer/libs/prismadb";
import { GateUserType } from "@/entitiesLayer/GateUser/model/services/getGateUsersFromApi";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";

export const getBlackListedGateUserFromDb = async () => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const gateUsers = await prisma?.gateUser.findMany({
      where: {isBlackListed: true},
      orderBy: {
        apartmentNumber: 'asc' 
      }
    }) as GateUserType[]
    console.log(gateUsers)
    return gateUsers
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from ViolationManagement');
  }
}