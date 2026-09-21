import moment from 'moment';
import { Penalty } from '../entities/penalty';
import { SubjectViolation, ViolationRules } from '../entities/violation';
import { CallsRepository } from '../ports/callsRepository';
import { PenaltiesRepository } from '../ports/penaltiesRepository';
import { GateClock } from './days';
import { listSubjectViolations } from './subjectViolations';
import { statsPeriods } from './violationStats';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type Dependencies = {
  calls: CallsRepository
  penalties: PenaltiesRepository
  clock: GateClock
  rules?: Partial<ViolationRules>
}

export type SubjectHistory = {
  subjectKey: string
  // 'YYYY-MM-DD', both included
  period: [string, string]
  // the newest first
  violations: SubjectViolation[]
  // every recorded penalty, the newest first: there are few of them and an old one still matters
  penalties: Penalty[]
}

// What an apartment (or a caller without an apartment) has done lately and how it was punished: the page
// of a resident shows it whatever day the calendar is on. The period is the "three months" of the statistics
// for today (this calendar month and the two before it), so the list and the numbers of the visitor card
// always agree. Reads only the storage, like the statistics.
export const createGetSubjectHistory = ({ calls, penalties, clock, rules = {} }: Dependencies) =>
  async (subjectKey: string): Promise<SubjectHistory> => {
    const now = clock.now();
    const [fromDay] = statsPeriods(clock.today()).threeMonths;

    const [passages, recorded] = await Promise.all([
      // Every day is judged as a whole, with the calls of all apartments, exactly like the violations page does:
      // redials are recognized among neighbouring calls, so the calls of one apartment alone would sometimes be
      // paired differently, and the history must show what the page of that day shows.
      calls.findPassagesByTimeRange(`${fromDay} 00:00:00`, moment(now).format(TIME_FORMAT)),
      penalties.listBySubject(subjectKey),
    ]);

    return {
      subjectKey,
      period: [fromDay, clock.today()],
      violations: listSubjectViolations(passages, subjectKey, now, rules).reverse(),
      penalties: recorded,
    };
  };
