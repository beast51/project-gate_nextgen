import moment from 'moment';
import { ActivityActor } from '../entities/activity';
import { GateUser } from '../entities/gateUser';
import { Penalty, PENALTY_MERGE_WINDOW_MINUTES, PenaltyLift, penaltySubjectKeyOf } from '../entities/penalty';
import { PenaltiesRepository } from '../ports/penaltiesRepository';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type Dependencies = {
  penalties: PenaltiesRepository
  // who imposes the penalties
  actor: ActivityActor
  // the wall clock time at the gate
  now: () => Date
}

export type PenaltyRecorder = {
  // the gate user has just been blocked
  imposed: (user: GateUser) => Promise<void>
  // the gate user was blocked before and still is: the term may have changed
  kept: (user: GateUser) => Promise<void>
  // the gate user may open the gate again
  lifted: (user: GateUser, how: PenaltyLift) => Promise<void>
}

const minutesBetween = (a: string, b: string) => Math.abs(moment(a, TIME_FORMAT).diff(moment(b, TIME_FORMAT), 'minutes'));

const later = (a: string, b: string) => (a > b ? a : b);

// Keeps the record of penalties while gate users are blocked and unblocked one phone at a time
export const createPenaltyRecorder = ({ penalties, actor, now }: Dependencies): PenaltyRecorder => {
  const localNow = () => moment(now()).format(TIME_FORMAT);

  const inForce = async (user: GateUser): Promise<Penalty | undefined> =>
    (await penalties.listBySubject(penaltySubjectKeyOf(user)))
      .find(penalty => !penalty.lifted && penalty.phoneNumbers.includes(user.phoneNumber));

  const start = (user: GateUser, from: string) => penalties.add({
    subjectKey: penaltySubjectKeyOf(user),
    apartmentNumber: user.apartmentNumber || null,
    phoneNumbers: [user.phoneNumber],
    from,
    until: user.blackListedTo || from,
    imposedBy: actor,
    lifted: null,
    source: 'recorded',
  });

  return {
    imposed: async (user) => {
      const from = user.blackListedFrom || localNow();
      const [latest] = await penalties.listBySubject(penaltySubjectKeyOf(user));

      // the next phone of the apartment that is being punished right now
      if (latest && !latest.lifted && minutesBetween(latest.from, from) <= PENALTY_MERGE_WINDOW_MINUTES) {
        await penalties.update(latest.id, {
          phoneNumbers: Array.from(new Set([...latest.phoneNumbers, user.phoneNumber])),
          until: later(latest.until, user.blackListedTo || latest.until),
        });
        return;
      }

      await start(user, from);
    },

    kept: async (user) => {
      const penalty = await inForce(user);

      // blocked before penalties were recorded: the record starts now, with the dates the user carries
      if (!penalty) return start(user, user.blackListedFrom || localNow());

      if (user.blackListedTo && user.blackListedTo !== penalty.until) {
        await penalties.update(penalty.id, { until: user.blackListedTo });
      }
    },

    lifted: async (user, how) => {
      const penalty = await inForce(user);
      if (penalty) await penalties.update(penalty.id, { lifted: { at: localNow(), how } });
    },
  };
};

// subject key -> days ('YYYY-MM-DD') its penalties started on
export const penaltyDaysBySubject = (penalties: Penalty[]): Record<string, string[]> =>
  penalties.reduce<Record<string, string[]>>((days, penalty) => {
    (days[penalty.subjectKey] ??= []).push(penalty.from.slice(0, 10));
    return days;
  }, {});
