import { Penalty } from '../../entities/penalty';
import { PenaltiesRepository } from '../../ports/penaltiesRepository';
import { PenaltyRecorder } from '../penalties';

// In-memory PenaltiesRepository
export const createFakePenaltiesRepository = (stored: Penalty[] = []) => {
  const state = { penalties: [...stored] };

  const repository: PenaltiesRepository = {
    add: async (penalty) => { state.penalties.push({ ...penalty, id: String(state.penalties.length + 1) }); },
    update: async (id, changes) => {
      state.penalties = state.penalties.map(penalty => penalty.id === id ? { ...penalty, ...changes } : penalty);
    },
    listBySubject: async (subjectKey) =>
      state.penalties.filter(penalty => penalty.subjectKey === subjectKey).sort((a, b) => b.from.localeCompare(a.from)),
    listStartedBetween: async (from, to) =>
      state.penalties.filter(penalty => penalty.from >= from && penalty.from <= to),
  };

  return { repository, state };
};

// for the tests that are not about penalties
export const noPenalties: PenaltyRecorder = {
  imposed: async () => {},
  kept: async () => {},
  lifted: async () => {},
};
