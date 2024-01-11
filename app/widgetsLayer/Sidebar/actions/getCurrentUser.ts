// import prisma from '@/libs/prismadb'
// import prisma from '../../../(appLayer)/libs/prismadb'
import { getPrismaClient } from '@/appLayer/libs/prismadb';
import getSession from './getSession';
// import getSession from "./getSession";

const getCurrentUser = async () => {
  try {
    const session = await getSession();
    const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
    if (!session?.user?.email) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email as string
      }
    });

    if (!currentUser) {
      return null;
    }

    return currentUser;
  } catch (error: any) {
    return null;
  }
};

export default getCurrentUser;