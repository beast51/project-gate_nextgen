// Grants or revokes the admin role of an account. An admin may read the activity journal of the gate.
//
//   node --env-file=.env scripts/grant-role.mjs                        list accounts with their tenants and roles
//   node --env-file=.env scripts/grant-role.mjs <phoneNumber> admin    the account becomes an admin
//   node --env-file=.env scripts/grant-role.mjs <phoneNumber> none     an ordinary operator again
//
// Accounts live in the database from DATABASE_URL.
import { PrismaClient } from '@prisma/client';

const [phoneNumber, role] = process.argv.slice(2);
const prisma = new PrismaClient();
const fields = { name: true, phoneNumber: true, tenant: true, role: true };

try {
  if (!phoneNumber) {
    console.table(await prisma.user.findMany({ select: fields }));
  } else if (role !== 'admin' && role !== 'none') {
    console.error('Usage: grant-role.mjs <phoneNumber> <admin|none>');
    process.exitCode = 1;
  } else {
    const user = await prisma.user.update({
      where: { phoneNumber },
      data: { role: role === 'none' ? null : role },
      select: fields,
    });
    console.log('Updated:', user);
  }
} finally {
  await prisma.$disconnect();
}
