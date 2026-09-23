// Brings every stored number plate to the form the application keeps them in: no spaces, upper case, Latin
// letters instead of the Cyrillic ones that look the same (core normalizeCarNumber). The gate users and the
// snapshots of the callers in the calls of the database from DATABASE_URL.
//
//   node --env-file=.env scripts/normalize-car-numbers.mjs            dry run: how many records would change, examples
//   node --env-file=.env scripts/normalize-car-numbers.mjs --apply    rewrites them
//
// Safe to run again: a plate that is already in the stored form is left alone. Letters without a Latin twin
// ("П") and foreign plates are kept as they are: they need a person, not a rule.
import { PrismaClient } from '@prisma/client';
import { normalizeCarNumber } from '../core/entities/gateUser.ts';

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

// a plate that is not in the stored form: a letter outside ASCII, a space or a lower case letter
const NOT_NORMALIZED = { carNumber: { $regex: '[^\\x00-\\x7F]|\\s|[a-z]' } };
const BATCH = 1000;

const same = (before, after) => JSON.stringify(before) === JSON.stringify(after);

const normalizeCollection = async (model, collection) => {
  const records = await prisma[model].findRaw({ filter: NOT_NORMALIZED, options: { projection: { carNumber: 1 } } });
  const changes = records
    .filter(record => Array.isArray(record.carNumber))
    .map(record => ({ id: record._id, before: record.carNumber, after: record.carNumber.map(normalizeCarNumber) }))
    .filter(change => !same(change.before, change.after));

  console.log(`${collection}: ${changes.length} of ${records.length} records to change`);
  changes.slice(0, 3).forEach(change => console.log('   ', JSON.stringify(change.before), '->', JSON.stringify(change.after)));

  if (!apply) return;

  for (let offset = 0; offset < changes.length; offset += BATCH) {
    const updates = changes
      .slice(offset, offset + BATCH)
      .map(change => ({ q: { _id: change.id }, u: { $set: { carNumber: change.after } } }));
    const result = await prisma.$runCommandRaw({ update: collection, updates });
    console.log(`    ${Math.min(offset + BATCH, changes.length)}/${changes.length} sent, modified ${result.nModified}`);
  }

  const left = await prisma.$runCommandRaw({ count: collection, query: NOT_NORMALIZED });
  console.log(`    still not normalized: ${left.n}`);
};

try {
  console.log(apply ? 'Rewriting the plates' : 'Dry run: nothing is written');
  await normalizeCollection('gateUser', 'GateUser');
  await normalizeCollection('call', 'Call');
} finally {
  await prisma.$disconnect();
}
