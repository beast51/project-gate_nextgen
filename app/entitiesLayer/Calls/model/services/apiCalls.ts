import { unitalkCallsProvider } from "../providers/unitalkCallsProvider";
import { CallsApiProvider } from "../types/Calls.type";


const createApiCalls = (provider: CallsApiProvider): CallsApiProvider => {
  return {
    getCallsFromApi: provider.getCallsFromApi
  };
};

export const unitalkApiCalls = createApiCalls(unitalkCallsProvider);