import { mongoDbCallsProvider, shotaConfig } from "../providers/mongoDbCallsProvider";
import { CallsDatabaseProvider } from "../types/Calls.type";

const createDatabaseCalls = ({
  isTimeToUpdateCalls,
  updateCallsData,
  getCallsByTimeRangeWithoutBlockedAndWithCause,
  getCallsFromDatabaseByTimeRange,
}: CallsDatabaseProvider): CallsDatabaseProvider => ({
  isTimeToUpdateCalls,
  updateCallsData,
  getCallsByTimeRangeWithoutBlockedAndWithCause,
  getCallsFromDatabaseByTimeRange,
});

export const shotaDatabaseCalls = createDatabaseCalls(mongoDbCallsProvider(shotaConfig.databaseKey));


