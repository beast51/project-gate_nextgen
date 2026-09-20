import { describe, expect, it } from 'vitest';
import { getTenantConfig, listTenants } from './tenants';

const unitalk = (prefix: string, project: string) => ({
  [`${prefix}UNITALK_URL`]: 'https://telephony.example',
  [`${prefix}UNITALK_AUTHORIZATION`]: 'auth',
  [`${prefix}UNITALK_INTERNAL_API_AUTHORIZATION`]: 'internal',
  [`${prefix}UNITALK_PROJECT_ID`]: project,
  [`${prefix}UNITALK_CAN_OPEN_GATES`]: '1',
});

const legacyEnv = { DATABASE_URL: 'mongodb://first/customer', ...unitalk('', 'first-project') };

describe('tenants registry', () => {
  it('keeps the first customer working with the variables without a prefix', () => {
    expect(listTenants(legacyEnv)).toEqual(['shota']);
    expect(getTenantConfig('shota', legacyEnv)).toMatchObject({
      key: 'shota',
      databaseUrl: 'mongodb://first/customer',
      callsSyncIntervalSeconds: 5,
      telephony: { provider: 'unitalk', unitalk: { projectId: 'first-project' } },
    });
  });

  it('connects a new customer with environment variables only', () => {
    const env = {
      ...legacyEnv,
      TENANT_GREEN_PARK_DATABASE_URL: 'mongodb://second/customer',
      TENANT_GREEN_PARK_CALLS_SYNC_INTERVAL_SECONDS: '30',
      ...unitalk('TENANT_GREEN_PARK_', 'second-project'),
    };

    expect(listTenants(env).sort()).toEqual(['green_park', 'shota']);
    expect(getTenantConfig('green_park', env)).toMatchObject({
      databaseUrl: 'mongodb://second/customer',
      callsSyncIntervalSeconds: 30,
      telephony: { unitalk: { projectId: 'second-project' } },
    });
  });

  it('never lends the variables of the first customer to another tenant', () => {
    const env = { ...legacyEnv, TENANT_GREEN_PARK_DATABASE_URL: 'mongodb://second/customer' };

    expect(() => getTenantConfig('green_park', env)).toThrow('TENANT_GREEN_PARK_UNITALK_URL');
  });

  it('prefers prefixed variables for the first customer too', () => {
    const env = { ...legacyEnv, TENANT_SHOTA_DATABASE_URL: 'mongodb://moved/customer' };

    expect(getTenantConfig('shota', env)?.databaseUrl).toBe('mongodb://moved/customer');
  });

  it('gives no access for an unknown or malformed tenant', () => {
    expect(getTenantConfig('prod', legacyEnv)).toBeNull();
    expect(getTenantConfig('SHOTA', legacyEnv)).toBeNull();
    expect(getTenantConfig('shota_database_url', legacyEnv)).toBeNull();
    expect(getTenantConfig('', legacyEnv)).toBeNull();
  });

  it('does not treat a demo-only deployment as a customer', () => {
    expect(listTenants({ DATABASE_URL: 'mongodb://accounts/only', DEMO_DATABASE_URL: 'mongodb://demo' })).toEqual([]);
  });

  it('refuses a telephony provider it can not build', () => {
    expect(() => getTenantConfig('shota', { ...legacyEnv, TENANT_SHOTA_TELEPHONY: 'other' })).toThrow('not supported');
  });
});
