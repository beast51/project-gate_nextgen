import getSession from '@/widgetsLayer/Sidebar/actions/getSession'
import { shotaDatabaseCalls } from '@/entitiesLayer/Calls/model/services/dbCalls';
import { findViolations as findViolationsInCalls } from '@/core/useCases/findViolations';
import { VisitsOutput } from '@/core/entities/violation';

const {
  isTimeToUpdateCalls,
  updateCallsData,
  getCallsByTimeRangeWithoutBlockedAndWithCause
} = shotaDatabaseCalls;

// Shell around the core use case: synchronizes and loads the calls, the rules live in core/useCases/findViolations
export const findViolations = async (from: string, to: string): Promise<VisitsOutput> => {

  const session = await getSession();
  if (session && !session.user?.email) {
    return {};
  }

  const isTimeToUpdate: boolean =  await isTimeToUpdateCalls()

  if (isTimeToUpdate) {
    updateCallsData(from, to)
  }

  const calls = await getCallsByTimeRangeWithoutBlockedAndWithCause(from, to)

  return findViolationsInCalls(calls)
}
