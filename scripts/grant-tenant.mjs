// Grants or revokes access of an account to a gate (tenant).
//
//   node --env-file=.env scripts/grant-tenant.mjs                      list accounts and their tenants
//   node --env-file=.env scripts/grant-tenant.mjs <phoneNumber> prod   the account works with the "prod" gate
//   node --env-file=.env scripts/grant-tenant.mjs <phoneNumber> none   back to a personal demo sandbox
//
// Accounts live in the database from DATABASE_URL. Tenant keys are listed in app/(appLayer)/libs/container.ts.
import { PrismaClient } from '@prisma/client';

const [phoneNumber, tenant] = process.argv.slice(2);
const prisma = new PrismaClient();

try {
  if (!phoneNumber) {
    const users = await prisma.user.findMany({ select: { name: true, phoneNumber: true, tenant: true } });
    console.table(users.map(user => ({ ...user, tenant: user.tenant ?? '(demo sandbox)' })));
  } else if (!tenant) {
    console.error('Usage: grant-tenant.mjs <phoneNumber> <tenant|none>');
    process.exitCode = 1;
  } else {
    const user = await prisma.user.update({
      where: { phoneNumber },
      data: { tenant: tenant === 'none' ? null : tenant },
      select: { name: true, phoneNumber: true, tenant: true },
    });
    console.log('Updated:', user);
  }
} finally {
  await prisma.$disconnect();
}
