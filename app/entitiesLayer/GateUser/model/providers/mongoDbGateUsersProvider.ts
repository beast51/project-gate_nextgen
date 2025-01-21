import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
import { GateUserType } from "../types/GateUser.type";
import { databaseList, getPrismaClient } from "@/appLayer/libs/prismadb";

export const MongoDbGateUsersProvider = () => {

  return {
    addGateUsersToDatabase: async (users: GateUserType[]): Promise<void> => {
      const session = await getSession();
      const prisma = getPrismaClient(session?.user?.name === 'spectator' ? databaseList.DEMO_DATABASE_URL : databaseList.DATABASE_URL);
      console.log('users!!!!!!!!!!!!!!!!!', users)
      if (!session?.user?.email) {
        return
      }
      let index = 0;
      for (const user of users) {
        console.log('!!!!!!!!!!!!!!! user', user)
        const existingGateUser = await prisma.gateUser.findFirst({
          where: {
            phoneNumber: user.phoneNumber,
          },
        });
        if (!existingGateUser) 
        await prisma.gateUser.create({
          data: {
            idInApi: user.idInApi,
            name: user.name,
            phoneNumber: user.phoneNumber,
            carNumber: Array.isArray(user.carNumber) ? user.carNumber : [user.carNumber] || [],
            apartmentNumber: user.apartmentNumber,
            isBlackListed: user.isBlackListed,
            blackListedFrom: '',
            blackListedTo: ''
          },
        });
        console.log(index + 1 + ' out of ' + users.length + ' users download to BD');
        index++;
      }
    },
    deleteGateUserFromDb: async (phoneNumber: string): Promise<void> => {
      const session = await getSession();
      const prisma = getPrismaClient(session?.user?.name === 'spectator' ? databaseList.DEMO_DATABASE_URL : databaseList.DATABASE_URL);
      if (!session?.user?.email) {
        return;
      }
      try {
        await prisma.gateUser.delete({
          where: {
            phoneNumber: phoneNumber,
          }
        }) 
    
        console.log(`User with phoneNumber: ${phoneNumber} deleted`)
      } catch (error) {
        console.error(error);
        throw new Error('Error while delete user');
      }
    },
    editGateUserInDb: async (data: GateUserType ) => {
      const session = await getSession();
      const prisma = getPrismaClient(session?.user?.name === 'spectator' ? databaseList.DEMO_DATABASE_URL : databaseList.DATABASE_URL);
    
      if (!session?.user?.email) {
        return
      }
    
      const user = await prisma?.gateUser.update({
        where: {
          phoneNumber: data.phoneNumber,
        },
        data,
      });
      console.log('user is now: ', user)
    },
    getGateUserFromDb: async (phoneNumber="") => {
      const session = await getSession();
      const prisma = getPrismaClient(session?.user?.name === 'spectator' ? databaseList.DEMO_DATABASE_URL : databaseList.DATABASE_URL);
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

  }
}