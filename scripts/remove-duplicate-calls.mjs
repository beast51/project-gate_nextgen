// Finds calls stored more than once (the same phone number and the same time) and removes the extra copies,
// keeping the copy that was stored first.
//
//   node --env-file=.env scripts/remove-duplicate-calls.mjs "2026-09-19 00:00:00" "2026-09-19 23:59:59"           dry run
//   node --env-file=.env scripts/remove-duplicate-calls.mjs "2026-09-19 00:00:00" "2026-09-19 23:59:59" --apply   delete
//
// Works with the database from DATABASE_URL.
import { PrismaClient } from '@prisma/client';

const [from, to, flag] = process.argv.slice(2);

if (!from || !to) {
  console.error('Usage: remove-duplicate-calls.mjs "<from>" "<to>" [--apply]');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const calls = await prisma.call.findMany({
    where: { time: { gte: from, lte: to } },
    select: { id: true, number: true, time: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const seen = new Set();
  const extraIds = [];

  for (const call of calls) {
    const key = `${call.number}|${call.time}`;
    if (seen.has(key)) extraIds.push(call.id);
    else seen.add(key);
  }

  console.log(`calls in the period: ${calls.length}, unique: ${seen.size}, extra copies: ${extraIds.length}`);

  if (flag === '--apply' && extraIds.length > 0) {
    const { count } = await prisma.call.deleteMany({ where: { id: { in: extraIds } } });
    console.log(`removed: ${count}`);
  } else if (extraIds.length > 0) {
    console.log('dry run, nothing was removed; add --apply to remove the extra copies');
  }
} finally {
  await prisma.$disconnect();
}
