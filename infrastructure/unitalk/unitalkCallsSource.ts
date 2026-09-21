import { IncomingCall } from '@/core/entities/call';
import { CallsSource } from '@/core/ports/callsSource';
import { unitalkCallOutcome } from './unitalkCallOutcome';
import { UnitalkConfig } from './unitalkConfig';

type HistoryCall = {
  from: string
  date: string
  secondsFullTime: number
  cause: number
  state: string
}

type HistoryResponse = {
  // total number of calls of the period, not of the page
  count: number
  calls: HistoryCall[]
  warning: string | null
}

// Unitalk returns at most this many calls per request, the rest has to be asked for page by page
const PAGE_SIZE = 1000;

// One synchronization is limited, so a request for a very long period can neither hang the page
// nor burn the rate limit of the API. What did not fit is loaded by the next synchronizations
// of the same period: calls that are already stored are skipped.
const MAX_PAGES_PER_REQUEST = 10;

const toIncomingCall = (call: HistoryCall): IncomingCall => ({
  number: call.from,
  time: call.date,
  secondsFullTime: call?.secondsFullTime,
  outcome: unitalkCallOutcome(call),
  cause: call?.cause,
  state: call?.state,
});

// dates may arrive wrapped in quotes from the query string
const withoutQuotes = (value: string) => value && value.split('"').join('');

export const createUnitalkCallsSource = (config: UnitalkConfig): CallsSource => {
  const getPage = async (from: string, to: string, offset: number): Promise<HistoryResponse> => {
    const response = await fetch(`${config.url}/api/history/get`, {
      method: 'POST',
      headers: {
        Authorization: config.internalApiAuthorization,
        ProjectId: config.projectId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateFrom: withoutQuotes(from),
        dateTo: withoutQuotes(to),
        limit: PAGE_SIZE,
        offset,
        filter: {
          direction: 'IN',
        },
      }),
    });

    return response.json();
  };

  return {
    getCalls: async (from = '', to = '') => {
      const calls: HistoryCall[] = [];

      for (let page = 0; page < MAX_PAGES_PER_REQUEST; page++) {
        const data = await getPage(from, to, page * PAGE_SIZE);
        calls.push(...data.calls);

        if (data.calls.length < PAGE_SIZE || calls.length >= data.count) break;
      }

      // Unitalk returns the newest calls first
      return calls.reverse().map(toIncomingCall);
    },
  };
};
