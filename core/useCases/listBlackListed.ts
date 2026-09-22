import { GateUser } from '../entities/gateUser';
import { Penalty, penaltySubjectKeyOf } from '../entities/penalty';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { PenaltiesRepository } from '../ports/penaltiesRepository';

type Dependencies = {
  gateUsers: GateUsersRepository
  penalties: PenaltiesRepository
}

export type BlackListedGateUser = GateUser & {
  // the penalty in force of the apartment (or of the phone); null when none was recorded
  penalty: Penalty | null
}

// Users with a penalty, with why they got it: the ground, the words of the operator and who imposed it
export const createListBlackListed = ({ gateUsers, penalties }: Dependencies) =>
  async (): Promise<BlackListedGateUser[]> => {
    const users = await gateUsers.listBlackListed();
    const subjects = Array.from(new Set(users.map(penaltySubjectKeyOf)));

    const inForce = new Map<string, Penalty | null>(await Promise.all(subjects.map(async (subjectKey): Promise<[string, Penalty | null]> => {
      const [latest] = await penalties.listBySubject(subjectKey);
      return [subjectKey, latest && !latest.lifted ? latest : null];
    })));

    return users.map(user => ({ ...user, penalty: inForce.get(penaltySubjectKeyOf(user)) ?? null }));
  };
