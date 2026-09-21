import moment from 'moment';
import { ActivityActor } from '../entities/activity';
import { GateUser } from '../entities/gateUser';
import {
  isPenaltyGround, isPenaltyLiftGround, Penalty, PENALTY_COMMENT_MAX_LENGTH, PENALTY_MERGE_WINDOW_MINUTES,
  PENALTY_REASON_MAX_DAYS, PenaltyLift, PenaltyNote, PenaltyReason, penaltySubjectKeyOf,
} from '../entities/penalty';
import { ViolationRules } from '../entities/violation';
import { CallsRepository } from '../ports/callsRepository';
import { PenaltiesRepository } from '../ports/penaltiesRepository';
import { penaltyReasonOf } from './penaltyReason';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type Dependencies = {
  penalties: PenaltiesRepository
  // the reason of a penalty is counted from the stored calls
  calls: CallsRepository
  // who imposes the penalties
  actor: ActivityActor
  // the wall clock time at the gate
  now: () => Date
  rules?: Partial<ViolationRules>
}

export type PenaltyRecorder = {
  // the gate user has just been blocked
  imposed: (user: GateUser, note?: PenaltyNote) => Promise<void>
  // the gate user was blocked before and still is: the term may have changed
  kept: (user: GateUser) => Promise<void>
  // the gate user may open the gate again
  lifted: (user: GateUser, how: PenaltyLift, note?: PenaltyNote) => Promise<void>
}

const minutesBetween = (a: string, b: string) => Math.abs(moment(a, TIME_FORMAT).diff(moment(b, TIME_FORMAT), 'minutes'));

const later = (a: string, b: string) => (a > b ? a : b);

export const cleanPenaltyComment = (comment: string | null | undefined): string | null =>
  comment?.trim().slice(0, PENALTY_COMMENT_MAX_LENGTH) || null;

// the phones of an apartment are blocked one by one, every time with a comment: the same words are kept once
const joinComments = (first: string | null, next: string | null) => {
  if (!next || first?.includes(next)) return first;
  return first ? `${first}\n${next}`.slice(0, PENALTY_COMMENT_MAX_LENGTH) : next;
};

// Keeps the record of penalties while gate users are blocked and unblocked one phone at a time
export const createPenaltyRecorder = ({ penalties, calls, actor, now, rules = {} }: Dependencies): PenaltyRecorder => {
  const localNow = () => moment(now()).format(TIME_FORMAT);

  const inForce = async (user: GateUser): Promise<Penalty | undefined> =>
    (await penalties.listBySubject(penaltySubjectKeyOf(user)))
      .find(penalty => !penalty.lifted && penalty.phoneNumbers.includes(user.phoneNumber));

  // The violations since the previous penalty ended. A reason that can not be counted never stops a penalty.
  const reasonOf = async (subjectKey: string, previous: Penalty | undefined): Promise<PenaltyReason | null> => {
    try {
      const oldest = moment(now()).subtract(PENALTY_REASON_MAX_DAYS, 'days').format(TIME_FORMAT);
      const since = later(previous ? (previous.lifted?.at ?? previous.until) : oldest, oldest);

      return penaltyReasonOf(await calls.findPassagesOfSubject(subjectKey, since, localNow()), subjectKey, since, now(), rules);
    } catch (error) {
      console.error(`Failed to count the reason of a penalty of ${subjectKey}`, error);
      return null;
    }
  };

  const start = async (user: GateUser, from: string, note: PenaltyNote, previous: Penalty | undefined) => {
    const subjectKey = penaltySubjectKeyOf(user);

    await penalties.add({
      subjectKey,
      apartmentNumber: user.apartmentNumber || null,
      phoneNumbers: [user.phoneNumber],
      from,
      until: user.blackListedTo || from,
      imposedBy: actor,
      ground: isPenaltyGround(note.ground) ? note.ground : null,
      comment: cleanPenaltyComment(note.comment),
      reason: await reasonOf(subjectKey, previous),
      lifted: null,
      source: 'recorded',
    });
  };

  return {
    imposed: async (user, note = {}) => {
      const from = user.blackListedFrom || localNow();
      const [latest] = await penalties.listBySubject(penaltySubjectKeyOf(user));

      // the next phone of the apartment that is being punished right now
      if (latest && !latest.lifted && minutesBetween(latest.from, from) <= PENALTY_MERGE_WINDOW_MINUTES) {
        await penalties.update(latest.id, {
          phoneNumbers: Array.from(new Set([...latest.phoneNumbers, user.phoneNumber])),
          until: later(latest.until, user.blackListedTo || latest.until),
          ground: latest.ground ?? (isPenaltyGround(note.ground) ? note.ground : null),
          comment: joinComments(latest.comment, cleanPenaltyComment(note.comment)),
        });
        return;
      }

      await start(user, from, note, latest);
    },

    kept: async (user) => {
      const penalty = await inForce(user);

      // blocked before penalties were recorded: the record starts now, with the dates the user carries
      if (!penalty) {
        const [latest] = await penalties.listBySubject(penaltySubjectKeyOf(user));
        return start(user, user.blackListedFrom || localNow(), {}, latest);
      }

      if (user.blackListedTo && user.blackListedTo !== penalty.until) {
        await penalties.update(penalty.id, { until: user.blackListedTo });
      }
    },

    lifted: async (user, how, note = {}) => {
      const penalty = await inForce(user);
      if (!penalty) return;

      await penalties.update(penalty.id, {
        lifted: {
          at: localNow(),
          how,
          ground: isPenaltyLiftGround(note.ground) ? note.ground : null,
          comment: cleanPenaltyComment(note.comment),
        },
      });
    },
  };
};

// subject key -> days ('YYYY-MM-DD') its penalties started on
export const penaltyDaysBySubject = (penalties: Penalty[]): Record<string, string[]> =>
  penalties.reduce<Record<string, string[]>>((days, penalty) => {
    (days[penalty.subjectKey] ??= []).push(penalty.from.slice(0, 10));
    return days;
  }, {});
