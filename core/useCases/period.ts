// A period of a journal, both borders are ISO 8601 in UTC and inclusive
export type Period = { from: string, to: string }

// What came from a request becomes a period only when both borders are real dates in the right order.
// Anything else means "no period": a journal then shows its latest records.
export const parsePeriod = (from: unknown, to: unknown): Period | undefined => {
  if (typeof from !== 'string' || typeof to !== 'string') return undefined;

  const start = new Date(from);
  const end = new Date(to);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return undefined;

  // normalized, so that the text comparison of stored ISO strings is a comparison of dates
  return { from: start.toISOString(), to: end.toISOString() };
};
