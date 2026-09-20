import { NextResponse } from 'next/server';
import { createAddGateUser } from '@/core/useCases/addGateUser';
import { createDeleteGateUser } from '@/core/useCases/deleteGateUser';
import { createEditGateUser } from '@/core/useCases/editGateUser';
import { createPrismaGateUsersRepository } from '@/infrastructure/prisma/prismaGateUsersRepository';
import { createUnitalkGateUsersDirectory } from '@/infrastructure/unitalk/unitalkGateUsersDirectory';
import { UnitalkConfig } from '@/infrastructure/unitalk/unitalkConfig';
import getSession from '@/widgetsLayer/Sidebar/actions/getSession';
import { databaseList, getPrismaClient } from './prismadb';

// Composition root: the only place that knows the session, the environment and the concrete adapters.
// Every gate (a customer or the demo stand) is a tenant with its own database and telephony project.

type Tenant = 'prod' | 'demo'

const DEMO_USER_NAME = 'spectator';

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
};

const tenantConfig = (tenant: Tenant): { database: databaseList, unitalk: UnitalkConfig } => {
  const isDemo = tenant === 'demo';

  return {
    database: isDemo ? databaseList.DEMO_DATABASE_URL : databaseList.DATABASE_URL,
    unitalk: {
      url: requiredEnv('UNITALK_URL'),
      authorization: requiredEnv('UNITALK_AUTHORIZATION'),
      internalApiAuthorization: requiredEnv('UNITALK_INTERNAL_API_AUTHORIZATION'),
      projectId: requiredEnv(isDemo ? 'DEMO_UNITALK_PROJECT_ID' : 'UNITALK_PROJECT_ID'),
      canOpenGatesResponsibleId: requiredEnv(isDemo ? 'DEMO_UNITALK_CAN_OPEN_GATES' : 'UNITALK_CAN_OPEN_GATES'),
    },
  };
};

const buildContainer = (tenant: Tenant) => {
  const config = tenantConfig(tenant);
  const prisma = getPrismaClient(config.database);

  const gateUsers = createPrismaGateUsersRepository(prisma);
  const directory = createUnitalkGateUsersDirectory(config.unitalk);

  return {
    tenant,
    listGateUsers: gateUsers.list,
    addGateUser: createAddGateUser({ directory, gateUsers }),
    editGateUser: createEditGateUser({ directory, gateUsers }),
    deleteGateUser: createDeleteGateUser({ directory, gateUsers }),
  };
};

export type Container = ReturnType<typeof buildContainer>

// Use cases of the tenant of the current user, null when the user is not signed in
export const getContainer = async (): Promise<Container | null> => {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  return buildContainer(session.user.name === DEMO_USER_NAME ? 'demo' : 'prod');
};

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
