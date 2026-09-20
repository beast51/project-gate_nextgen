import { PrismaClient } from '@prisma/client';
import { SandboxStorage } from '@/core/ports/sandboxStorage';

// Personal demo databases. Every account without a tenant gets its own MongoDB database on the demo cluster
// (DEMO_DATABASE_URL): MongoDB creates a database on the first write, so nothing has to be provisioned.
// The demo cluster must be a separate cluster (or at least a separate database user) from customer data.

declare global {
  var sandboxClients: Map<string, PrismaClient> | undefined;
}

// every client keeps its own connection pool, so only a few stay open in one server instance
const MAX_OPEN_SANDBOX_CLIENTS = 5;

const sandboxDatabaseName = (accountId: string) => {
  if (!/^[a-zA-Z0-9]+$/.test(accountId)) {
    throw new Error('Unexpected account id');
  }
  return `demo_${accountId}`;
};

export const sandboxDatabaseUrl = (baseUrl: string, accountId: string) => {
  const match = baseUrl.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(\?.*)?$/);
  if (!match) {
    throw new Error('DEMO_DATABASE_URL is not a MongoDB connection string');
  }
  const [, server, query = ''] = match;
  return `${server}/${sandboxDatabaseName(accountId)}${query}`;
};

const clients = () => (globalThis.sandboxClients = globalThis.sandboxClients ?? new Map());

export const getSandboxPrismaClient = (accountId: string): PrismaClient => {
  const opened = clients();
  const existing = opened.get(accountId);

  if (existing) {
    // move to the end: the map keeps the least recently used client first
    opened.delete(accountId);
    opened.set(accountId, existing);
    return existing;
  }

  const baseUrl = process.env.DEMO_DATABASE_URL;
  if (!baseUrl) {
    throw new Error('Environment variable DEMO_DATABASE_URL is missing');
  }

  const client = new PrismaClient({ datasources: { db: { url: sandboxDatabaseUrl(baseUrl, accountId) } } });
  opened.set(accountId, client);

  if (opened.size > MAX_OPEN_SANDBOX_CLIENTS) {
    const [leastRecentlyUsedId, leastRecentlyUsed] = opened.entries().next().value!;
    opened.delete(leastRecentlyUsedId);
    leastRecentlyUsed.$disconnect().catch(console.error);
  }

  return client;
};

export const sandboxStorage: SandboxStorage = {
  drop: async (accountId) => {
    const client = getSandboxPrismaClient(accountId);
    await client.$runCommandRaw({ dropDatabase: 1 });
    clients().delete(accountId);
    await client.$disconnect();
  },
};
