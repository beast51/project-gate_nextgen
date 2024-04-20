import { getPrismaClient } from "@/appLayer/libs/prismadb";
import { GateUserType } from "@/entitiesLayer/GateUser/model/services/getGateUsersFromApi";
import { isTimeToRemoveFromBlackList } from "@/sharedLayer/utils/utils";
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
    return gateUsers
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from ViolationManagement');
  }
}

const  editGateUserOnApi = async (body: {
  name?: string
  phoneNumber?: string
  carNumber?: string[]
  apartmentNumber?: string
  id?: string
  isBlackListed?: boolean
}) => {
  const CAN_OPEN_GATES = "20879";

  const url = `${process.env.UNITALK_URL}/contacts/set`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_AUTHORIZATION!,
    ProjectId: process.env.UNITALK_PROJECT_ID!,
    'Content-Type': 'application/json',
  };

  const payload = { 
    "address": body.apartmentNumber,  
    "email": '', 
    "id": Number(body.id), 
    "name": body.name,
    "note": body.carNumber?.join(','),
    'phones': [body.phoneNumber],
    "responsible": body.isBlackListed ? null : CAN_OPEN_GATES, 
  };

  console.log('payload', payload)

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })
  console.log('\nedited ' + body.phoneNumber)
  // console.log('response', response)
}

const editGateUserInDb = async (data: {
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


export const unblockExpiredPenaltiesUsers = async () => {

  const gateUsers = await getBlackListedGateUserFromDb()

  const expiredPenaltiesUsers = gateUsers.filter(user => isTimeToRemoveFromBlackList(user.blackListedTo));
  console.log('!!!', expiredPenaltiesUsers)
  
  const unblocked: string[] = []

  expiredPenaltiesUsers.forEach(async (user) => {
    unblocked.push(user.phoneNumber)
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

  return unblocked
}