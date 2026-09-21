// Restores the penalties of the time before they were recorded. Every stored call keeps a snapshot of the
// caller, "blocked from .. until" included, so a penalty during which the blocked person called at least
// once can be found. Gate users that are blocked right now are added even if they did not call.
//
//   node --env-file=.env scripts/restore-penalties.mjs <since>            dry run: only shows what it found
//   node --env-file=.env scripts/restore-penalties.mjs <since> --apply    writes the missing penalties
//
// <since>  'YYYY-MM-DD': penalties that started on this day or later
//
// The same rule as in core/entities/penalty.ts: phones of one apartment blocked within 30 minutes are ONE
// penalty. Safe to run again: a penalty that is already stored (same apartment, same start) is skipped.
import { PrismaClient } from '@prisma/client';

const [since] = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const apply = process.argv.includes('--apply');
const MERGE_WINDOW_MS = 30 * 60 * 1000;
const TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

if (!/^\d{4}-\d{2}-\d{2}$/.test(since ?? '')) {
  console.error('Usage: node --env-file=.env scripts/restore-penalties.mjs <since YYYY-MM-DD> [--apply]');
  process.exit(1);
}

const prisma = new PrismaClient();
const pad = value => String(value).padStart(2, '0');
const localNow = (() => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TENANT_SHOTA_TIMEZONE || 'Europe/Kyiv', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${pad(parts.hour)}:${parts.minute}:${parts.second}`;
})();

try {
  const calls = await prisma.call.findMany({
    where: { isBlackListed: true, blackListedFrom: { gte: since } },
    select: { number: true, apartmentNumber: true, blackListedFrom: true, blackListedTo: true },
  });
  const blockedNow = await prisma.gateUser.findMany({
    where: { isBlackListed: true, blackListedFrom: { gte: since } },
    select: { phoneNumber: true, apartmentNumber: true, blackListedFrom: true, blackListedTo: true },
  });

  // one block of one phone
  const blocks = new Map();
  const note = (number, apartmentNumber, from, until) => {
    if (!TIME.test(from ?? '') || !TIME.test(until ?? '')) return;
    const key = `${number}|${from}`;
    const block = blocks.get(key) ?? { number, apartmentNumber: apartmentNumber || null, from, until };
    if (until > block.until) block.until = until;
    blocks.set(key, block);
  };
  calls.forEach(call => note(call.number, call.apartmentNumber, call.blackListedFrom, call.blackListedTo));
  blockedNow.forEach(user => note(user.phoneNumber, user.apartmentNumber, user.blackListedFrom, user.blackListedTo));

  // blocks of one apartment that started within the window are one penalty
  const penalties = [];
  const bySubject = new Map();
  [...blocks.values()].sort((a, b) => a.from.localeCompare(b.from)).forEach(block => {
    const subjectKey = block.apartmentNumber || block.number;
    const last = bySubject.get(subjectKey);

    if (last && new Date(block.from.replace(' ', 'T')) - new Date(last.from.replace(' ', 'T')) <= MERGE_WINDOW_MS) {
      if (!last.phoneNumbers.includes(block.number)) last.phoneNumbers.push(block.number);
      if (block.until > last.until) last.until = block.until;
      return;
    }

    const penalty = { subjectKey, apartmentNumber: block.apartmentNumber, phoneNumbers: [block.number], from: block.from, until: block.until };
    penalties.push(penalty);
    bySubject.set(subjectKey, penalty);
  });

  // a gate user that is blocked right now with the same start: the penalty is still in force
  const isInForce = penalty => blockedNow.some(user => penalty.phoneNumbers.includes(user.phoneNumber) && user.blackListedFrom === penalty.from);

  const stored = await prisma.penalty.findMany({ where: { from: { gte: since } }, select: { subjectKey: true, from: true } });
  const isStored = penalty => stored.some(other => other.subjectKey === penalty.subjectKey
    && Math.abs(new Date(other.from.replace(' ', 'T')) - new Date(penalty.from.replace(' ', 'T'))) <= MERGE_WINDOW_MS);

  const missing = penalties.filter(penalty => !isStored(penalty));
  const byMonth = {};
  penalties.forEach(penalty => { byMonth[penalty.from.slice(0, 7)] = (byMonth[penalty.from.slice(0, 7)] ?? 0) + 1; });

  console.log(`since ${since}: blocks of phones ${blocks.size} -> penalties of apartments ${penalties.length} (already stored ${penalties.length - missing.length}, to write ${missing.length})`);
  console.log('by month:', JSON.stringify(byMonth));
  console.log('in force now:', penalties.filter(isInForce).length);
  missing.forEach(penalty => console.log(`  кв. ${penalty.apartmentNumber ?? '—'}  ${penalty.from} -> ${penalty.until}  phones: ${penalty.phoneNumbers.length}`));

  if (!apply) {
    console.log('\nDry run: nothing was written. Add --apply to write.');
  } else if (missing.length > 0) {
    await prisma.penalty.createMany({
      data: missing.map(penalty => {
        const inForce = isInForce(penalty);
        return {
          ...penalty,
          imposedById: null,
          imposedByName: null,
          // when it really ended is unknown: the end of the term is the best guess
          liftedAt: inForce ? null : (penalty.until < localNow ? penalty.until : localNow),
          liftedHow: inForce ? null : 'expired',
          source: 'restoredFromCalls',
        };
      }),
    });
    await prisma.$runCommandRaw({
      createIndexes: 'Penalty',
      indexes: [
        { key: { from: 1 }, name: 'Penalty_from_idx' },
        { key: { subjectKey: 1, from: 1 }, name: 'Penalty_subjectKey_from_idx' },
      ],
    });
    console.log(`\nWritten: ${missing.length}`);
  }
} finally {
  await prisma.$disconnect();
}
