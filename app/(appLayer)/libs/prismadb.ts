// import { PrismaClient } from '@prisma/client'

// declare global {
//   var prisma: PrismaClient | undefined
// }

// const client = globalThis.prisma || new PrismaClient()
// if (process.env.NODE_ENV !== 'production' ) globalThis.prisma = client

// export default client


import { PrismaClient } from '@prisma/client';

declare global {
  var prismaClients: { [key: string]: PrismaClient } | undefined;
}

function getPrismaClient(databaseKey: string): PrismaClient {

  globalThis.prismaClients = globalThis.prismaClients ?? {};

  if (!globalThis.prismaClients[databaseKey]) {
    const databaseUrl = process.env[databaseKey];
    globalThis.prismaClients[databaseKey] = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  }

  return globalThis.prismaClients[databaseKey];
}

export { getPrismaClient };
