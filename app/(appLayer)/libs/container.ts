import { NextResponse } from 'next/server';
import { ApiErrorResponse } from '@/contracts';
import { Account } from '@/core/entities/account';
import { ActivityActor, SYSTEM_ACTOR } from '@/core/entities/activity';
import { AccessLog } from '@/core/ports/accessLog';
import { ActivityLog } from '@/core/ports/activityLog';
import { CallsRepository } from '@/core/ports/callsRepository';
import { CallsSource } from '@/core/ports/callsSource';
import { GateUsersDirectory } from '@/core/ports/gateUsersDirectory';
import { GateUsersRepository } from '@/core/ports/gateUsersRepository';
import { PenaltiesRepository } from '@/core/ports/penaltiesRepository';
import { createGetAccessLog, createRecordPageView, createRecordSignIn } from '@/core/useCases/access';
import { createGetActivity, createRecordActivity } from '@/core/useCases/activity';
import { createAddGateUser } from '@/core/useCases/addGateUser';
import { createBackfillCalls } from '@/core/useCases/backfillCalls';
import { createGateClock } from '@/core/useCases/days';
import { createDeleteGateUser } from '@/core/useCases/deleteGateUser';
import { createCleanupDemoSandboxes } from '@/core/useCases/demo/cleanupDemoSandboxes';
import { createSeedDemoSandbox } from '@/core/useCases/demo/seedDemoSandbox';
import { createEditGateUser } from '@/core/useCases/editGateUser';
import { createGetCalls } from '@/core/useCases/getCalls';
import { createGetViolations } from '@/core/useCases/getViolations';
import { createGetViolationStats } from '@/core/useCases/getViolationStats';
import { createImportGateUsers } from '@/core/useCases/importGateUsers';
import { createPenaltyRecorder } from '@/core/useCases/penalties';
import { createRestorePenalties } from '@/core/useCases/restorePenalties';
import { createRefreshCalls, createSyncCalls } from '@/core/useCases/syncCalls';
import { createSyncGateUsers } from '@/core/useCases/syncGateUsers';
import { createUnblockExpiredPenalties } from '@/core/useCases/unblockExpiredPenalties';
import { createDemoCallsSource, createDemoGateUsersDirectory } from '@/infrastructure/demo/demoTelephony';
import { createPrismaAccessLog } from '@/infrastructure/prisma/prismaAccessLog';
import { createPrismaAccountsRepository } from '@/infrastructure/prisma/prismaAccountsRepository';
import { createPrismaActivityLog } from '@/infrastructure/prisma/prismaActivityLog';
import { createPrismaCallsRepository } from '@/infrastructure/prisma/prismaCallsRepository';
import { createPrismaGateUsersRepository } from '@/infrastructure/prisma/prismaGateUsersRepository';
import { createPrismaPenaltiesRepository } from '@/infrastructure/prisma/prismaPenaltiesRepository';
import { unitalkCallOutcome } from '@/infrastructure/unitalk/unitalkCallOutcome';
import { createUnitalkCallsSource } from '@/infrastructure/unitalk/unitalkCallsSource';
import { createUnitalkGateUsersDirectory } from '@/infrastructure/unitalk/unitalkGateUsersDirectory';
import { databaseList, getPrismaClient, getPrismaClientByUrl } from './prismadb';
import { getSandboxPrismaClient, sandboxStorage } from './sandboxes';
import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';
import { getSession } from './session';
import { DEFAULT_TIMEZONE, getTenantConfig, listTenants } from './tenants';

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
  penalties: PenaltiesRepository
  directory: GateUsersDirectory
  source: CallsSource
  // null: the calls are never loaded from the telephony
  callsSyncIntervalSeconds: number | null
  // where the gate stands: call times are its wall clock time
  timeZone: string
  activityLog: ActivityLog
  accessLog: AccessLog
  // who the actions are recorded for: the signed in account, or the application for scheduled jobs
  actor: ActivityActor
  // the journal shows what every operator did, so only an admin of the gate may read it
  mayReadActivity: boolean
}

const assemble = ({
  gateUsers, calls, penalties, directory, source, callsSyncIntervalSeconds, timeZone, activityLog, accessLog, actor, mayReadActivity,
}: Adapters) => {
  const clock = createGateClock(timeZone);
  const syncCalls = createSyncCalls({ source, calls, gateUsers });
  const recordActivity = createRecordActivity({ log: activityLog, actor });
  const penaltyRecorder = createPenaltyRecorder({ penalties, calls, actor, now: clock.now });

  const refreshCalls = callsSyncIntervalSeconds === null
    ? async () => {}
    : createRefreshCalls({ calls, syncCalls, today: clock.today, minIntervalSeconds: callsSyncIntervalSeconds });

  return {
    getCalls: createGetCalls({ calls, refreshCalls }),
    getViolations: createGetViolations({ calls, refreshCalls, now: clock.now }),
    getViolationStats: createGetViolationStats({ calls, penalties, clock, tracksCoverage: callsSyncIntervalSeconds !== null }),
    // null: there is no telephony to load the history from, or the account may not start it
    backfillCalls: callsSyncIntervalSeconds !== null && mayReadActivity
      ? createBackfillCalls({ calls, syncCalls, today: clock.today, minIntervalSeconds: callsSyncIntervalSeconds })
      : null,
    // null: only an admin of the gate may rewrite the history of penalties
    restorePenalties: mayReadActivity ? createRestorePenalties({ calls, gateUsers, penalties, now: clock.now }) : null,
    unblockExpiredPenalties: createUnblockExpiredPenalties({ directory, gateUsers, recordActivity, penalties: penaltyRecorder }),
    listGateUsers: gateUsers.list,
    listBlackListedGateUsers: gateUsers.listBlackListed,
    syncGateUsers: createSyncGateUsers({ directory, gateUsers, recordActivity }),
    importGateUsers: createImportGateUsers({ gateUsers, recordActivity }),
    addGateUser: createAddGateUser({ directory, gateUsers, recordActivity }),
    editGateUser: createEditGateUser({ directory, gateUsers, recordActivity, penalties: penaltyRecorder }),
    deleteGateUser: createDeleteGateUser({ directory, gateUsers, recordActivity }),
    // sign ins and opened pages are recorded for everybody
    recordSignIn: createRecordSignIn({ log: accessLog, actor }),
    recordPageView: createRecordPageView({ log: accessLog, actor, locales: i18nConfig.locales }),
    // null: the account is not allowed to read the journals
    activity: mayReadActivity
      ? { list: createGetActivity({ log: activityLog }), listActors: activityLog.listActors }
      : null,
    access: mayReadActivity
      ? { list: createGetAccessLog({ log: accessLog }), listActors: accessLog.listActors }
      : null,
  };
};

export type Container = ReturnType<typeof assemble>

const buildTenantContainer = (tenant: string, actor: ActivityActor, mayReadActivity: boolean): Container | null => {
  const config = getTenantConfig(tenant);
  if (!config) return null;

  const prisma = getPrismaClientByUrl(`tenant:${config.key}`, config.databaseUrl);

  return assemble({
    gateUsers: createPrismaGateUsersRepository(prisma),
    // calls stored before outcomes existed carry only the codes of the provider of this tenant
    calls: createPrismaCallsRepository(prisma, { legacyOutcomeOf: unitalkCallOutcome }),
    penalties: createPrismaPenaltiesRepository(prisma),
    directory: createUnitalkGateUsersDirectory(config.telephony.unitalk),
    source: createUnitalkCallsSource(config.telephony.unitalk),
    callsSyncIntervalSeconds: config.callsSyncIntervalSeconds,
    timeZone: config.timeZone,
    activityLog: createPrismaActivityLog(prisma),
    accessLog: createPrismaAccessLog(prisma),
    actor,
    mayReadActivity,
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
  const activityLog = createPrismaActivityLog(prisma);
  const penalties = createPrismaPenaltiesRepository(prisma);
  const actor = { id: account.id, name: account.name };

  // once per server instance: fill an empty sandbox and note that it is in use.
  // Simultaneous first requests of one visitor share the same preparation.
  const prepared = (globalThis.preparedSandboxes = globalThis.preparedSandboxes ?? new Map());

  if (!prepared.has(account.id)) {
    prepared.set(account.id, (async () => {
      await createSeedDemoSandbox({ gateUsers, calls, activityLog, penalties, actor, seed: account.id })();
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
    penalties,
    directory: createDemoGateUsersDirectory(),
    source: createDemoCallsSource(),
    callsSyncIntervalSeconds: null,
    timeZone: DEFAULT_TIMEZONE,
    activityLog,
    accessLog: createPrismaAccessLog(prisma),
    actor,
    // a sandbox has one visitor, its owner: the journal shows only their own actions
    mayReadActivity: true,
  });
};

// Use cases for the current user, null when the user is not signed in or the account has no valid access
export const getContainer = async (): Promise<Container | null> => {
  const session = await getSession();
  const accountId = session?.user?.id;

  return accountId ? getContainerOfAccount(accountId) : null;
};

// The same without a session: at the moment of signing in there is an account but no session yet
export const getContainerOfAccount = async (accountId: string): Promise<Container | null> => {
  // the stored account is read on every request: granting and revoking access works immediately
  const account = await accounts().findById(accountId);

  if (!account) return null;

  return account.tenant
    ? buildTenantContainer(account.tenant, { id: account.id, name: account.name }, account.role === 'admin')
    : buildSandboxContainer(account);
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
    ? listTenants()
      .map(tenant => buildTenantContainer(tenant, SYSTEM_ACTOR, false))
      .filter((container): container is Container => Boolean(container))
    : null;

export const getCleanupDemoSandboxes = (request: Request) =>
  isCronRequest(request)
    ? createCleanupDemoSandboxes({ accounts: accounts(), sandboxes: sandboxStorage })
    : null;

export const forbidden = () => NextResponse.json<ApiErrorResponse>({ error: 'Forbidden' }, { status: 403 });

export const unauthorized = () => NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
