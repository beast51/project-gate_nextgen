import moment from 'moment';
import { GateUser } from '../entities/gateUser';
import { NewPenalty, PENALTY_MERGE_WINDOW_MINUTES, PENALTY_REASON_MAX_DAYS } from '../entities/penalty';
import { ViolationRules } from '../entities/violation';
import { CallsRepository, PenaltySnapshot } from '../ports/callsRepository';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { PenaltiesRepository } from '../ports/penaltiesRepository';
import { penaltyReasonOf } from './penaltyReason';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type Dependencies = {
  calls: CallsRepository
  gateUsers: GateUsersRepository
  penalties: PenaltiesRepository
  // the wall clock time at the gate
  now: () => Date
  rules?: Partial<ViolationRules>
}

export type RestoredPenalties = {
  // blocks of single phones the snapshots tell about
  blocks: number
  // penalties of apartments they make, the ones that are stored already included
  found: number
  // what is missing in the record, oldest first; written when `apply` is set
  missing: NewPenalty[]
  written: number
}

const isTime = (value: string) => moment(value, TIME_FORMAT, true).isValid();

const minutesBetween = (a: string, b: string) => Math.abs(moment(a, TIME_FORMAT).diff(moment(b, TIME_FORMAT), 'minutes'));

// Restores the penalties of the time before they were recorded, from the snapshots the calls keep and from
// the gate users that are blocked right now. Only a penalty during which the blocked person called at least
// once can be found. Who imposed it and why is lost; what it was for is counted again from the calls.
// Safe to repeat: a penalty that is stored already (same subject, same start) is skipped.
export const createRestorePenalties = ({ calls, gateUsers, penalties, now, rules = {} }: Dependencies) =>
  async (since: string, { apply = false }: { apply?: boolean } = {}): Promise<RestoredPenalties> => {
    const blockedNow = (await gateUsers.listBlackListed()).filter((user: GateUser) => (user.blackListedFrom ?? '') >= since);
    const snapshots: PenaltySnapshot[] = [
      ...await calls.findPenaltySnapshots(since),
      ...blockedNow.map(user => ({
        number: user.phoneNumber,
        apartmentNumber: user.apartmentNumber || null,
        blackListedFrom: user.blackListedFrom ?? '',
        blackListedTo: user.blackListedTo ?? '',
      })),
    ].filter(snapshot => isTime(snapshot.blackListedFrom) && isTime(snapshot.blackListedTo));

    // one block of one phone, with the longest term it ever had
    const blocks = new Map<string, PenaltySnapshot>();
    snapshots.forEach(snapshot => {
      const key = `${snapshot.number}|${snapshot.blackListedFrom}`;
      const known = blocks.get(key);
      if (!known || snapshot.blackListedTo > known.blackListedTo) blocks.set(key, snapshot);
    });

    // blocks of one apartment that started within the window are one penalty
    const found: NewPenalty[] = [];
    const latestOf = new Map<string, NewPenalty>();

    Array.from(blocks.values())
      .sort((a, b) => a.blackListedFrom.localeCompare(b.blackListedFrom))
      .forEach(block => {
        const subjectKey = block.apartmentNumber || block.number;
        const latest = latestOf.get(subjectKey);

        if (latest && minutesBetween(latest.from, block.blackListedFrom) <= PENALTY_MERGE_WINDOW_MINUTES) {
          if (!latest.phoneNumbers.includes(block.number)) latest.phoneNumbers.push(block.number);
          if (block.blackListedTo > latest.until) latest.until = block.blackListedTo;
          return;
        }

        const penalty: NewPenalty = {
          subjectKey,
          apartmentNumber: block.apartmentNumber || null,
          phoneNumbers: [block.number],
          from: block.blackListedFrom,
          until: block.blackListedTo,
          imposedBy: null,
          ground: null,
          comment: null,
          reason: null,
          lifted: null,
          source: 'restoredFromCalls',
        };
        found.push(penalty);
        latestOf.set(subjectKey, penalty);
      });

    const localNow = moment(now()).format(TIME_FORMAT);
    const previousEndOf = new Map<string, string>();

    for (const penalty of found) {
      const inForce = blockedNow.some(user =>
        penalty.phoneNumbers.includes(user.phoneNumber) && user.blackListedFrom === penalty.from);

      // when it really ended is unknown: the end of the term is the best guess
      if (!inForce) {
        penalty.lifted = { at: penalty.until < localNow ? penalty.until : localNow, how: 'expired', ground: null, comment: null };
      }

      const oldest = moment(penalty.from, TIME_FORMAT).subtract(PENALTY_REASON_MAX_DAYS, 'days').format(TIME_FORMAT);
      const previousEnd = previousEndOf.get(penalty.subjectKey);
      const reasonSince = previousEnd && previousEnd > oldest ? previousEnd : oldest;

      penalty.reason = penaltyReasonOf(
        await calls.findPassagesOfSubject(penalty.subjectKey, reasonSince, penalty.from),
        penalty.subjectKey,
        reasonSince,
        moment(penalty.from, TIME_FORMAT).toDate(),
        rules,
      );
      previousEndOf.set(penalty.subjectKey, penalty.lifted?.at ?? penalty.until);
    }

    const stored = await penalties.listStartedBetween(since, '9999-12-31 23:59:59');
    const missing = found.filter(penalty => !stored.some(other =>
      other.subjectKey === penalty.subjectKey && minutesBetween(other.from, penalty.from) <= PENALTY_MERGE_WINDOW_MINUTES));

    if (apply) {
      for (const penalty of missing) await penalties.add(penalty);
    }

    return { blocks: blocks.size, found: found.length, missing, written: apply ? missing.length : 0 };
  };
