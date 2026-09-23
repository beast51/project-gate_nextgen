// The plates as the operator typed them, one line separated by commas. The server brings every plate
// to the stored form (upper case, Latin letters, no spaces), here they are only split.
// Without plates the stored "no plates" value is kept: a repeated save must not look like a change.
export const parsePlates = (typed: string, stored: string[]): string[] => {
  const plates = typed.split(',').map(plate => plate.trim()).filter(Boolean);
  if (plates.length > 0) return plates;

  return stored.some(plate => plate.trim()) ? [''] : stored;
};

// what the operator sees in the field
export const platesLine = (stored: string[]) => stored.filter(plate => plate.trim()).join(', ');
