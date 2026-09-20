import { NextResponse } from 'next/server';
import { createAddGateUser } from '@/core/useCases/addGateUser';
import { createDeleteGateUser } from '@/core/useCases/deleteGateUser';
import { createEditGateUser } from '@/core/useCases/editGateUser';
import { createGetCalls } from '@/core/useCases/getCalls';
import { createGetViolations } from '@/core/useCases/getViolations';
import { createImportGateUsers } from '@/core/useCases/importGateUsers';
import { createRefreshCalls, createSyncCalls } from '@/core/useCases/syncCalls';
import { createSyncGateUsers } from '@/core/useCases/syncGateUsers';
import { createUnblockExpiredPenalties } from '@/core/useCases/unblockExpiredPenalties';
import { createPrismaCallsRepository } from '@/infrastructure/prisma/prismaCallsRepository';
import { createPrismaGateUsersRepository } from '@/infrastructure/prisma/prismaGateUsersRepository';
import { createUnitalkCallsSource } from '@/infrastructure/unitalk/unitalkCallsSource';
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

type TenantConfig = {
  database: databaseList
  // rate limit of the telephony API: not more than one calls synchronization per this number of seconds
  callsSyncIntervalSeconds: number
  // the demo stand shows prepared calls, it never loads real ones from the telephony
  syncCallsFromTelephony: boolean
  unitalk: UnitalkConfig
}

const tenantConfig = (tenant: Tenant): TenantConfig => {
  const isDemo = tenant === 'demo';

  return {
    database: isDemo ? databaseList.DEMO_DATABASE_URL : databaseList.DATABASE_URL,
    callsSyncIntervalSeconds: 5,
    syncCallsFromTelephony: !isDemo,
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
  const calls = createPrismaCallsRepository(prisma);
  const directory = createUnitalkGateUsersDirectory(config.unitalk);
  const source = createUnitalkCallsSource(config.unitalk);

  const syncCalls = createSyncCalls({ source, calls, gateUsers });

  const refreshCalls = config.syncCallsFromTelephony
    ? createRefreshCalls({ calls, syncCalls, minIntervalSeconds: config.callsSyncIntervalSeconds })
    : async () => {};

  return {
    tenant,
    getCalls: createGetCalls({ calls, refreshCalls }),
    getViolations: createGetViolations({ calls, refreshCalls }),
    unblockExpiredPenalties: createUnblockExpiredPenalties({ directory, gateUsers }),
    listGateUsers: gateUsers.list,
    listBlackListedGateUsers: gateUsers.listBlackListed,
    syncGateUsers: createSyncGateUsers({ directory, gateUsers }),
    importGateUsers: createImportGateUsers({ gateUsers }),
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

// Use cases for jobs that run without a user (Vercel cron). Vercel sends `Authorization: Bearer <CRON_SECRET>`
// when the CRON_SECRET environment variable is set; without the variable there is no system access at all.
export const getCronContainer = (request: Request): Container | null => {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return null;
  }

  return buildContainer('prod');
};

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
