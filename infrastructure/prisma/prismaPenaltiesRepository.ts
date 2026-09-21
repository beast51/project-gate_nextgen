import { Penalty as PenaltyRecord, PrismaClient } from '@prisma/client';
import { isPenaltyGround, isPenaltyLiftGround, Penalty } from '@/core/entities/penalty';
import { PenaltiesRepository } from '@/core/ports/penaltiesRepository';

const toPenalty = (record: PenaltyRecord): Penalty => ({
  id: record.id,
  subjectKey: record.subjectKey,
  apartmentNumber: record.apartmentNumber,
  phoneNumbers: record.phoneNumbers,
  from: record.from,
  until: record.until,
  imposedBy: record.imposedById ? { id: record.imposedById, name: record.imposedByName ?? '' } : null,
  ground: isPenaltyGround(record.ground) ? record.ground : null,
  comment: record.comment,
  reason: record.reason,
  lifted: record.liftedAt ? {
    at: record.liftedAt,
    how: record.liftedHow === 'manually' ? 'manually' : 'expired',
    ground: isPenaltyLiftGround(record.liftedGround) ? record.liftedGround : null,
    comment: record.liftedComment,
  } : null,
  source: record.source === 'restoredFromCalls' || record.source === 'restoredFromRefusals' ? record.source : 'recorded',
});

export const createPrismaPenaltiesRepository = (prisma: PrismaClient): PenaltiesRepository => ({
  add: async ({ imposedBy, lifted, ...penalty }) => {
    await prisma.penalty.create({
      data: {
        ...penalty,
        imposedById: imposedBy?.id ?? null,
        imposedByName: imposedBy?.name ?? null,
        liftedAt: lifted?.at ?? null,
        liftedHow: lifted?.how ?? null,
        liftedGround: lifted?.ground ?? null,
        liftedComment: lifted?.comment ?? null,
      },
    });
  },

  update: async (id, { lifted, ...changes }) => {
    await prisma.penalty.update({
      where: { id },
      data: {
        ...changes,
        ...(lifted !== undefined && {
          liftedAt: lifted?.at ?? null,
          liftedHow: lifted?.how ?? null,
          liftedGround: lifted?.ground ?? null,
          liftedComment: lifted?.comment ?? null,
        }),
      },
    });
  },

  listBySubject: async (subjectKey) =>
    (await prisma.penalty.findMany({ where: { subjectKey }, orderBy: { from: 'desc' } })).map(toPenalty),

  listStartedBetween: async (from, to) =>
    (await prisma.penalty.findMany({ where: { from: { gte: from, lte: to } } })).map(toPenalty),
});
