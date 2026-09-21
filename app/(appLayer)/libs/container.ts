import { NextResponse } from 'next/server';
import { ApiErrorResponse } from '@/contracts';
import { Account } from '@/core/entities/account';
import { CallsRepository } from '@/core/ports/callsRepository';
import { CallsSource } from '@/core/ports/callsSource';
import { GateUsersDirectory } from '@/core/ports/gateUsersDirectory';
import { GateUsersRepository } from '@/core/ports/gateUsersRepository';
import { createAddGateUser } from '@/core/useCases/addGateUser';
import { createDeleteGateUser } from '@/core/useCases/deleteGateUser';
import { createCleanupDemoSandboxes } from '@/core/useCases/demo/cleanupDemoSandboxes';
import { createSeedDemoSandbox } from '@/core/useCases/demo/seedDemoSandbox';
import { createEditGateUser } from '@/core/useCases/editGateUser';
import { createGetCalls } from '@/core/useCases/getCalls';
import { createGetViolations } from '@/core/useCases/getViolations';
import { createImportGateUsers } from '@/core/useCases/importGateUsers';
import { createRefreshCalls, createSyncCalls } from '@/core/useCases/syncCalls';
import { createSyncGateUsers } from '@/core/useCases/syncGateUsers';
import { createUnblockExpiredPenalties } from '@/core/useCases/unblockExpiredPenalties';
import { createDemoCallsSource, createDemoGateUsersDirectory } from '@/infrastructure/demo/demoTelephony';
import { createPrismaAccountsRepository } from '@/infrastructure/prisma/prismaAccountsRepository';
import { createPrismaCallsRepository } from '@/infrastructure/prisma/prismaCallsRepository';
import { createPrismaGateUsersRepository } from '@/infrastructure/prisma/prismaGateUsersRepository';
import { unitalkCallOutcome } from '@/infrastructure/unitalk/unitalkCallOutcome';
import { createUnitalkCallsSource } from '@/infrastructure/unitalk/unitalkCallsSource';
import { createUnitalkGateUsersDirectory } from '@/infrastructure/unitalk/unitalkGateUsersDirectory';
import { databaseList, getPrismaClient, getPrismaClientByUrl } from './prismadb';
import { getSandboxPrismaClient, sandboxStorage } from './sandboxes';
import { getSession } from './session';
import { getTenantConfig, listTenants } from './tenants';

// Composition root: the only place that knows the session, the environment and the concrete adapters.
//
// Who sees what is decided by the stored account, never by a name or by the session token:
//  - an account with a `tenant` works with the database and the telephony of that gate (customer);
//  - an account without a tenant (everyone who has just registered) works in a personal demo sandbox:
//    its own database with synthetic data and a telephony that does nothing. It can not reach customer data.
// Access to a gate is granted by setting `tenant` of the account (scripts/grant-tenant.mjs).
// The gates themselves are described by environment variables, see libs/tenants.ts.

type Adapters = {
  gateUsers: GateUsersRepository
  calls: CallsRepository
  directory: GateUsersDirectory
  source: CallsSource
  // null: the calls are never loaded from the telephony
  callsSyncIntervalSeconds: number | null
}

const assemble = ({ gateUsers, calls, directory, source, callsSyncIntervalSeconds }: Adapters) => {
  const syncCalls = createSyncCalls({ source, calls, gateUsers });

  const refreshCalls = callsSyncIntervalSeconds === null
    ? async () => {}
    : createRefreshCalls({ calls, syncCalls, minIntervalSeconds: callsSyncIntervalSeconds });

  return {
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

export type Container = ReturnType<typeof assemble>

const buildTenantContainer = (tenant: string): Container | null => {
  const config = getTenantConfig(tenant);
  if (!config) return null;

  const prisma = getPrismaClientByUrl(`tenant:${config.key}`, config.databaseUrl);

  return assemble({
    gateUsers: createPrismaGateUsersRepository(prisma),
    // calls stored before outcomes existed carry only the codes of the provider of this tenant
    calls: createPrismaCallsRepository(prisma, { legacyOutcomeOf: unitalkCallOutcome }),
    directory: createUnitalkGateUsersDirectory(config.telephony.unitalk),
    source: createUnitalkCallsSource(config.telephony.unitalk),
    callsSyncIntervalSeconds: config.callsSyncIntervalSeconds,
  });
};

const accounts = () => createPrismaAccountsRepository(getPrismaClient(databaseList.DATABASE_URL));

declare global {
  var preparedSandboxes: Map<string, Promise<void>> | undefined;
}

const buildSandboxContainer = async (account: Account): Promise<Container> => {
  const prisma = getSandboxPrismaClient(account.id);
  const gateUsers = createPrismaGateUsersRepository(prisma);
  const calls = createPrismaCallsRepository(prisma);

  // once per server instance: fill an empty sandbox and note that it is in use.
  // Simultaneous first requests of one visitor share the same preparation.
  const prepared = (globalThis.preparedSandboxes = globalThis.preparedSandboxes ?? new Map());

  if (!prepared.has(account.id)) {
    prepared.set(account.id, (async () => {
      await createSeedDemoSandbox({ gateUsers, calls, seed: account.id })();
      await accounts().markSandboxUsed(account.id, new Date());
    })());
  }

  try {
    await prepared.get(account.id);
  } catch (error) {
    prepared.delete(account.id);
    throw error;
  }

  return assemble({
    gateUsers,
    calls,
    directory: createDemoGateUsersDirectory(),
    source: createDemoCallsSource(),
    callsSyncIntervalSeconds: null,
  });
};

// Use cases for the current user, null when the user is not signed in or the account has no valid access
export const getContainer = async (): Promise<Container | null> => {
  const session = await getSession();
  const accountId = session?.user?.id;

  if (!accountId) return null;

  // the stored account is read on every request: granting and revoking access works immediately
  const account = await accounts().findById(accountId);

  if (!account) return null;

  return account.tenant ? buildTenantContainer(account.tenant) : buildSandboxContainer(account);
};

// Jobs that run without a user (Vercel cron). Vercel sends `Authorization: Bearer <CRON_SECRET>`
// when the CRON_SECRET environment variable is set; without the variable there is no system access at all.
const isCronRequest = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
};

// containers of all gates: a scheduled job has to serve every customer
export const getCronContainers = (request: Request): Container[] | null =>
  isCronRequest(request)
    ? listTenants().map(buildTenantContainer).filter((container): container is Container => Boolean(container))
    : null;

export const getCleanupDemoSandboxes = (request: Request) =>
  isCronRequest(request)
    ? createCleanupDemoSandboxes({ accounts: accounts(), sandboxes: sandboxStorage })
    : null;

export const unauthorized = () => NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
