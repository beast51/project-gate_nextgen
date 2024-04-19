import { getPrismaClient } from "@/appLayer/libs/prismadb";
import { GateUserType } from "@/entitiesLayer/GateUser/model/services/getGateUsersFromApi";
import { isTimeToRemoveFromBlackList } from "@/sharedLayer/utils/utils";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
import axios from "axios";
import { editGateUserInDb, editGateUserOnApi } from "../../GateUserPage/model/gateUsers";

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
    return gateUsers
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from ViolationManagement');
  }
}


export const unblockExpiredPenaltiesUsers = async () => {

  const gateUsers = await getBlackListedGateUserFromDb()

  const expiredPenaltiesUsers = gateUsers.filter(user => isTimeToRemoveFromBlackList(user.blackListedTo));
  
  expiredPenaltiesUsers.forEach(async (user) => {
    await editGateUserOnApi({
      name: user.name,
      phoneNumber: user.phoneNumber,
      carNumber: user.carNumber,
      apartmentNumber: user.apartmentNumber,
      id: user.idInApi,
      isBlackListed: !user.isBlackListed, 
    });
  
    await editGateUserInDb({
      name: user.name,
      phoneNumber: user.phoneNumber,
      carNumber: user.carNumber,
      apartmentNumber: user.apartmentNumber,
      idInApi: user.idInApi,
      isBlackListed: !user.isBlackListed, 
      blackListedFrom: user.blackListedFrom,
      blackListedTo: user.blackListedTo,
      image: user.image,
    })
  })
}