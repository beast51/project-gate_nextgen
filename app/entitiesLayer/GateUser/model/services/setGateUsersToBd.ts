import { GateUserType } from "./getGateUsersFromApi";
// import prisma from "../../../../(appLayer)/libs/prismadb"
import getSession from "../../../../widgetsLayer/Sidebar/actions/getSession"
import { getPrismaClient } from "@/appLayer/libs/prismadb";

export const setGateUsersToBd = async (users: GateUserType[]) => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  console.log('users!!!!!!!!!!!!!!!!!', users)
  if (!session?.user?.email) {
    return null
  }
  let index = 0;
  for (const user of users) {
    console.log('!!!!!!!!!!!!!!! user', user)
    const existingGateUser = await prisma?.gateUser.findFirst({
      where: {
        phoneNumber: user.phoneNumber,
        // carNumber: user.carNumber
      },
    });
    // console.log('user', user)
    if (!existingGateUser) 
    await prisma?.gateUser.create({
      data: {
        id: user.id && user.id,
        idInApi: user.idInApi,
        name: user.name,
        phoneNumber: user.phoneNumber,
        carNumber: Array.isArray(user.carNumber) ? user.carNumber : [user.carNumber] || [],
        apartmentNumber: user.apartmentNumber,
        image: '',
        isBlackListed: user.isBlackListed,
        blackListedFrom: '',
        blackListedTo: ''
      },
    });
    console.log(index + ' out of ' + users.length + ' users download to BD');
    index++;
  }
}