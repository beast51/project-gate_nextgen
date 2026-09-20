import { PrismaClient } from '@prisma/client';

declare global {
  var prismaClients: { [key: string]: PrismaClient } | undefined;
}

export enum databaseList {
  DATABASE_URL = 'DATABASE_URL',
  DEMO_DATABASE_URL = 'DEMO_DATABASE_URL'
} 

function getPrismaClient(databaseKey: databaseList): PrismaClient {

  globalThis.prismaClients = globalThis.prismaClients ?? {};

  if (!globalThis.prismaClients[databaseList[databaseKey]]) {
    const databaseUrl = process.env[databaseList[databaseKey]];
    globalThis.prismaClients[databaseList[databaseKey]] = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  }

  return globalThis.prismaClients[databaseList[databaseKey]];
}

// One client (one connection pool) per database, `key` names the database in the cache
function getPrismaClientByUrl(key: string, url: string): PrismaClient {
  globalThis.prismaClients = globalThis.prismaClients ?? {};

  if (!globalThis.prismaClients[key]) {
    globalThis.prismaClients[key] = new PrismaClient({ datasources: { db: { url } } });
  }

  return globalThis.prismaClients[key];
}

export { getPrismaClient, getPrismaClientByUrl };
