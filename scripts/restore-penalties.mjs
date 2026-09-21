// Restores the penalties of the time before they were recorded. Every stored call keeps a snapshot of the
// caller, "blocked from .. until" included, so a penalty during which the blocked person called at least
// once can be found; gate users that are blocked right now are added even if they did not call. What each
// penalty was for (violations and minutes since the previous one) is counted by the rules of the application,
// which is why the work is done by the application itself: POST /api/penalties/restore.
//
//   node --env-file=.env scripts/restore-penalties.mjs <adminPhoneNumber> <since> [baseUrl]            dry run
//   node --env-file=.env scripts/restore-penalties.mjs <adminPhoneNumber> <since> [baseUrl] --apply    writes
//
// <since>  'YYYY-MM-DD': penalties that started on this day or later
// Load the history of calls first (scripts/backfill-calls.mjs): the reasons are counted from the stored calls.
// A line marked with R is a penalty known only by the refusals of the gate: its dates are the first and the last refusal.
// Safe to run again: a penalty that is already stored (same apartment, same start) is skipped.
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const apply = process.argv.includes('--apply');
const [phoneNumber, since, baseUrl = 'http://localhost:3000'] = args;

if (!phoneNumber || !/^\d{4}-\d{2}-\d{2}$/.test(since ?? '') || !process.env.NEXTAUTH_SECRET) {
  console.error('Usage: node --env-file=.env scripts/restore-penalties.mjs <adminPhoneNumber> <since YYYY-MM-DD> [baseUrl] [--apply]');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const account = await prisma.user.findUnique({ where: { phoneNumber }, select: { id: true, name: true, tenant: true, role: true } });

  if (!account?.tenant || account.role !== 'admin') {
    console.error('The account must be an admin of a gate (scripts/grant-tenant.mjs, scripts/grant-role.mjs)');
    process.exit(1);
  }

  const token = await encode({ token: { sub: account.id, name: account.name }, secret: process.env.NEXTAUTH_SECRET, maxAge: 60 * 60 });
  const response = await fetch(`${baseUrl}/api/penalties/restore`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `next-auth.session-token=${token}; __Secure-next-auth.session-token=${token}` },
    body: JSON.stringify({ since, apply }),
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${await response.text()}`);
    process.exit(1);
  }

  const result = await response.json();

  console.log(`Gate "${account.tenant}", since ${since}: blocks of phones in the "blocked" notes ${result.blocks}; refusals of the gate no note explains ${result.refusals.calls} -> ${result.refusals.penalties} more penalties; penalties of apartments in all ${result.found}, missing in the record ${result.missing.length}`);
  result.missing.forEach(penalty => console.log(
    `  ${penalty.byRefusals ? 'R' : ' '} кв. ${String(penalty.apartmentNumber ?? '—').padEnd(7)} ${penalty.from} -> ${penalty.until}  ${penalty.inForce ? 'in force' : `lifted ${penalty.liftedHow} ${penalty.liftedAt}`}`
    + `  phones ${penalty.phones}  for: over 45 min ×${penalty.overstays} (${penalty.overstayMinutes} min, ${penalty.minutesOverLimit} over the limit), no exit ×${penalty.openVisits}`,
  ));

  if (!apply) {
    console.log('\nDry run: nothing was written. Add --apply to write.');
  } else {
    // Prisma creates MongoDB indexes only with `db push`, which is never run against this database
    if (account.tenant === 'shota' || process.env[`TENANT_${account.tenant.toUpperCase()}_DATABASE_URL`] === process.env.DATABASE_URL) {
      await prisma.$runCommandRaw({
        createIndexes: 'Penalty',
        indexes: [
          { key: { from: 1 }, name: 'Penalty_from_idx' },
          { key: { subjectKey: 1, from: 1 }, name: 'Penalty_subjectKey_from_idx' },
        ],
      });
    }
    console.log(`\nWritten: ${result.written}`);
  }
} finally {
  await prisma.$disconnect();
}
