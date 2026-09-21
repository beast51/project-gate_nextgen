// Gently loads the missing history of calls from the telephony: ONE day per request, with a pause between
// the requests, through the same rate limit guard the operators use. Safe to stop (Ctrl+C) and to start
// again: days that are already loaded are skipped.
//
//   node --env-file=.env scripts/backfill-calls.mjs <adminPhoneNumber> <from> <to> [baseUrl] [--dry-run]
//   node --env-file=.env scripts/backfill-calls.mjs 380932808527 2026-06-01 2026-09-20 http://localhost:3000
//
// <from>, <to>   days 'YYYY-MM-DD', both included; today and the future are never touched
// baseUrl        a running application (default http://localhost:3000); it works with the gate of the admin
// --dry-run      does not call the application: only shows what would be asked
//
// The pause is 12-18 seconds (random): about 4 requests a minute, 90 days take about 25 minutes.
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
const [phoneNumber, from, to, baseUrl = 'http://localhost:3000'] = args;

const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');
const pause = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));
const randomBetween = (min, max) => min + Math.random() * (max - min);

if (!phoneNumber || !isDay(from) || !isDay(to) || !process.env.NEXTAUTH_SECRET) {
  console.error('Usage: node --env-file=.env scripts/backfill-calls.mjs <adminPhoneNumber> <from> <to> [baseUrl] [--dry-run]');
  process.exit(1);
}

const prisma = new PrismaClient();
const account = await prisma.user.findUnique({ where: { phoneNumber }, select: { id: true, name: true, tenant: true, role: true } });
await prisma.$disconnect();

if (!account?.tenant || account.role !== 'admin') {
  console.error('The account must be an admin of a gate (scripts/grant-tenant.mjs, scripts/grant-role.mjs)');
  process.exit(1);
}

console.log(`Gate "${account.tenant}", ${from} .. ${to}, through ${baseUrl}${dryRun ? ' (dry run)' : ''}`);
if (dryRun) process.exit(0);

// a short-lived session of the admin, the same the application issues at sign in
const token = await encode({ token: { sub: account.id, name: account.name }, secret: process.env.NEXTAUTH_SECRET, maxAge: 60 * 60 });
const cookie = `next-auth.session-token=${token}; __Secure-next-auth.session-token=${token}`;

let failures = 0;

for (;;) {
  const response = await fetch(`${baseUrl}/api/calls/backfill`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ from, to }),
  });

  if (!response.ok) {
    // never insist: a failing telephony is left alone
    console.error(`${new Date().toISOString()}  HTTP ${response.status}: ${await response.text()}`);
    if (++failures >= 2) { console.error('Stopped. Start again later: loaded days are kept.'); process.exit(1); }
    await pause(60);
    continue;
  }

  failures = 0;
  const step = await response.json();

  if (step.status === 'done') { console.log('Done: every day of the period is loaded.'); break; }

  console.log(step.status === 'filled'
    ? `${new Date().toISOString()}  ${step.day}: +${step.added} calls, ${step.remaining} days left`
    : `${new Date().toISOString()}  the telephony was just used by somebody, waiting (${step.remaining} days left)`);

  if (step.status === 'filled' && step.remaining === 0) { console.log('Done.'); break; }

  await pause(randomBetween(12, 18));
}
