import { IncomingCall } from '@/core/entities/call';
import { CallsSource } from '@/core/ports/callsSource';
import { UnitalkConfig } from './unitalkConfig';

type HistoryCall = {
  from: string
  date: string
  secondsFullTime: number
  cause: number
  state: string
}

type HistoryResponse = {
  count: number
  calls: HistoryCall[]
  warning: string | null
}

const toIncomingCall = (call: HistoryCall): IncomingCall => ({
  number: call.from,
  time: call.date,
  secondsFullTime: call?.secondsFullTime,
  cause: call?.cause,
  state: call?.state,
});

// dates may arrive wrapped in quotes from the query string
const withoutQuotes = (value: string) => value && value.split('"').join('');

export const createUnitalkCallsSource = (config: UnitalkConfig): CallsSource => ({
  getCalls: async (from = '', to = '') => {
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
        limit: 1000,
        offset: 0,
        filter: {
          direction: 'IN',
        },
      }),
    });

    const data: HistoryResponse = await response.json();

    // Unitalk returns the newest calls first
    return data.calls.reverse().map(toIncomingCall);
  },
});
