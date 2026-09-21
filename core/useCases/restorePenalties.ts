import moment from 'moment';
import { PassageCall, UNREGISTERED_CALLER_NAME } from '../entities/call';
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
  // blocks of single phones the "blocked from .. until" notes tell about
  blocks: number
  // calls the gate refused that no note explains, and the penalties they make
  refusals: { calls: number, penalties: number }
  // penalties of apartments they make, the ones that are stored already included
  found: number
  // what is missing in the record, oldest first; written when `apply` is set
  missing: NewPenalty[]
  written: number
}

const isTime = (value: string) => moment(value, TIME_FORMAT, true).isValid();

// A penalty lasts 8 or 15 days. Refusals of one phone further apart than this belong to different penalties.
const LONGEST_TERM_DAYS = 16;

// the gate stays closed until somebody lifts the penalty, which may happen a little after the end of the term
const LIFT_DELAY_DAYS = 2;

const daysBetween = (a: string, b: string) => Math.abs(moment(a, TIME_FORMAT).diff(moment(b, TIME_FORMAT), 'days', true));

// A refusal alone proves nothing: the gate sometimes turns a caller away by mistake, and the caller gets in with
// the next call a minute later (a third of the refusals without the "blocked" note of 2026; none of those with it).
// Nobody lifts a penalty within minutes, so a refusal is taken for a block only when the gate did not open
// for that phone for at least this long afterwards.
const CLOSED_FOR_HOURS = 24;

// Episodes of one phone being refused: from the first to the last refusal, ended by a long silence
// or by the gate opening for that phone again.
const refusalEpisodes = (passages: PassageCall[]) => {
  const byPhone = new Map<string, PassageCall[]>();
  passages
    .filter(call => call.callerName !== UNREGISTERED_CALLER_NAME && (call.outcome === 'refused' || call.outcome === 'opened'))
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(call => byPhone.set(call.number, [...(byPhone.get(call.number) ?? []), call]));

  type Episode = { number: string, apartmentNumber: string | null, from: string, until: string, calls: number, openedAgainAt: string | null };
  const episodes: Episode[] = [];

  byPhone.forEach((calls, number) => {
    let current: Episode | null = null;

    calls.forEach(call => {
      if (call.outcome === 'opened') {
        if (current) current.openedAgainAt = call.time;
        current = null;
        return;
      }

      if (current && daysBetween(current.until, call.time) <= LONGEST_TERM_DAYS) {
        current.until = call.time;
        current.calls += 1;
      } else {
        current = { number, apartmentNumber: call.apartmentNumber, from: call.time, until: call.time, calls: 1, openedAgainAt: null };
        episodes.push(current);
      }
    });
  });

  return episodes
    .filter(episode => !episode.openedAgainAt
      || moment(episode.openedAgainAt, TIME_FORMAT).diff(moment(episode.until, TIME_FORMAT), 'hours', true) >= CLOSED_FOR_HOURS)
    .sort((a, b) => a.from.localeCompare(b.from));
};

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

    // --- penalties no note tells about. The note gets into a call only when the calls are loaded while the penalty
    // is in force; a refusal is a sign of a block by itself. What a known penalty already explains is skipped.
    const known = [...found, ...await penalties.listStartedBetween(
      moment(since, TIME_FORMAT).subtract(LONGEST_TERM_DAYS, 'days').format(TIME_FORMAT), '9999-12-31 23:59:59',
    )];
    const isExplained = (subjectKey: string, from: string, until: string) => known.some(penalty =>
      penalty.subjectKey === subjectKey
      && moment(penalty.from, TIME_FORMAT).subtract(1, 'hours').format(TIME_FORMAT) <= from
      && until <= moment(penalty.lifted?.at ?? penalty.until, TIME_FORMAT).add(LIFT_DELAY_DAYS, 'days').format(TIME_FORMAT));

    const unexplained = refusalEpisodes(await calls.findPassagesByTimeRange(since, moment(now()).format(TIME_FORMAT)))
      .filter(episode => !isExplained(episode.apartmentNumber || episode.number, episode.from, episode.until));

    const fromRefusals: NewPenalty[] = [];
    unexplained.forEach(episode => {
      const subjectKey = episode.apartmentNumber || episode.number;
      // the phones of an apartment are blocked together: their episodes overlap or nearly do
      const same = fromRefusals.find(penalty => penalty.subjectKey === subjectKey
        && episode.from <= moment(penalty.until, TIME_FORMAT).add(LIFT_DELAY_DAYS, 'days').format(TIME_FORMAT));

      if (same) {
        if (!same.phoneNumbers.includes(episode.number)) same.phoneNumbers.push(episode.number);
        if (episode.until > same.until) same.until = episode.until;
        return;
      }

      fromRefusals.push({
        subjectKey,
        apartmentNumber: episode.apartmentNumber || null,
        phoneNumbers: [episode.number],
        from: episode.from,
        until: episode.until,
        imposedBy: null,
        ground: null,
        comment: null,
        reason: null,
        lifted: null,
        source: 'restoredFromRefusals',
      });
    });

    found.push(...fromRefusals);
    found.sort((a, b) => a.from.localeCompare(b.from));

    const localNow = moment(now()).format(TIME_FORMAT);
    const previousEndOf = new Map<string, string>();

    for (const penalty of found) {
      const inForce = blockedNow.some(user =>
        penalty.phoneNumbers.includes(user.phoneNumber) && user.blackListedFrom === penalty.from);

      // The only certain trace of a penalty is the "blocked from .. until" note in a call. When and how it really
      // ended can not be read from the calls (an unanswered call looks the same for a blocked caller and for
      // a slow gate), so a restored penalty is closed by its own term.
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

    return {
      blocks: blocks.size,
      refusals: { calls: unexplained.reduce((sum, episode) => sum + episode.calls, 0), penalties: fromRefusals.length },
      found: found.length,
      missing,
      written: apply ? missing.length : 0,
    };
  };
