import { UnitalkConfig } from '@/infrastructure/unitalk/unitalkConfig';

// Registry of gates (customers). A tenant is described only by environment variables, so connecting
// a new customer needs no code change:
//
//   TENANT_<KEY>_DATABASE_URL                         required, its presence declares the tenant
//   TENANT_<KEY>_TELEPHONY                            provider, "unitalk" by default
//   TENANT_<KEY>_UNITALK_URL / _UNITALK_AUTHORIZATION / _UNITALK_INTERNAL_API_AUTHORIZATION /
//   TENANT_<KEY>_UNITALK_PROJECT_ID / _UNITALK_CAN_OPEN_GATES
//   TENANT_<KEY>_CALLS_SYNC_INTERVAL_SECONDS          rate limit of the telephony API, 5 by default
//
// <KEY> is the tenant key in upper case: the tenant "shota" reads TENANT_SHOTA_*.
// The first customer was configured before tenants existed: its variables have no prefix
// (DATABASE_URL, UNITALK_*). They keep working as a fallback for LEGACY_TENANT.

export const LEGACY_TENANT = 'shota';

const DEFAULT_CALLS_SYNC_INTERVAL_SECONDS = 5;

type Env = Record<string, string | undefined>

export type TenantConfig = {
  key: string
  databaseUrl: string
  callsSyncIntervalSeconds: number
  telephony: { provider: 'unitalk', unitalk: UnitalkConfig }
}

const isTenantKey = (key: string) => /^[a-z][a-z0-9_]*$/.test(key);

const reader = (env: Env, tenant: string) => {
  const read = (name: string) =>
    env[`TENANT_${tenant.toUpperCase()}_${name}`] || (tenant === LEGACY_TENANT ? env[name] : undefined);

  const required = (name: string) => {
    const value = read(name);
    if (!value) {
      throw new Error(`Tenant "${tenant}": environment variable TENANT_${tenant.toUpperCase()}_${name} is missing`);
    }
    return value;
  };

  return { read, required };
};

// Keys of all tenants that are configured in the environment
export const listTenants = (env: Env = process.env): string[] => {
  const declared = Object.keys(env)
    .map(name => name.match(/^TENANT_([A-Z][A-Z0-9_]*?)_DATABASE_URL$/)?.[1].toLowerCase())
    .filter((key): key is string => Boolean(key) && Boolean(env[`TENANT_${key!.toUpperCase()}_DATABASE_URL`]));

  // DATABASE_URL alone is not a tenant: it also holds the accounts of a demo-only deployment
  const legacy = env.DATABASE_URL && env.UNITALK_PROJECT_ID ? [LEGACY_TENANT] : [];

  return Array.from(new Set([...declared, ...legacy]));
};

// null for an unknown tenant: an account that points to it gets no access at all
export const getTenantConfig = (tenant: string, env: Env = process.env): TenantConfig | null => {
  if (!isTenantKey(tenant) || !listTenants(env).includes(tenant)) return null;

  const { read, required } = reader(env, tenant);

  const provider = read('TELEPHONY') || 'unitalk';
  if (provider !== 'unitalk') {
    throw new Error(`Tenant "${tenant}": telephony provider "${provider}" is not supported`);
  }

  const interval = Number(read('CALLS_SYNC_INTERVAL_SECONDS'));

  return {
    key: tenant,
    databaseUrl: required('DATABASE_URL'),
    callsSyncIntervalSeconds: interval > 0 ? interval : DEFAULT_CALLS_SYNC_INTERVAL_SECONDS,
    telephony: {
      provider,
      unitalk: {
        url: required('UNITALK_URL'),
        authorization: required('UNITALK_AUTHORIZATION'),
        internalApiAuthorization: required('UNITALK_INTERNAL_API_AUTHORIZATION'),
        projectId: required('UNITALK_PROJECT_ID'),
        canOpenGatesResponsibleId: required('UNITALK_CAN_OPEN_GATES'),
      },
    },
  };
};
