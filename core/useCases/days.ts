import moment from 'moment-timezone';

const DAY_FORMAT = 'YYYY-MM-DD';

export const isDay = (value: string) => moment(value, DAY_FORMAT, true).isValid();

// every calendar day from the first to the last, both included
export const daysBetween = (fromDay: string, toDay: string): string[] => {
  const days: string[] = [];
  for (const day = moment(fromDay, DAY_FORMAT); !day.isAfter(moment(toDay, DAY_FORMAT), 'day'); day.add(1, 'day')) {
    days.push(day.format(DAY_FORMAT));
  }
  return days;
};

// The clock of a gate. The times of the calls are stored as wall clock time of the place where the gate
// stands ('YYYY-MM-DD HH:mm:ss'), while a server may run in any time zone (UTC on Vercel).
export type GateClock = {
  // 'YYYY-MM-DD' at the gate
  today: () => string
  // the wall clock time at the gate as a Date of the server: comparable with `new Date(call.time)`
  now: () => Date
}

export const createGateClock = (timeZone: string, instant: () => Date = () => new Date()): GateClock => ({
  today: () => moment.tz(instant(), timeZone).format(DAY_FORMAT),
  now: () => new Date(moment.tz(instant(), timeZone).format('YYYY-MM-DDTHH:mm:ss')),
});
