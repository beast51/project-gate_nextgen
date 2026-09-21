import { VisitsDto } from '@/contracts';
import { Searchable } from '@/sharedLayer/lib/search';

// What a card of the violations page can be found by. The key of a card is the apartment number; only a caller
// without an apartment (`apartmentNumber: null`) is grouped by the phone number, and then the key is that number.
export const searchableVisitor = (key: string, { aboutUser }: VisitsDto): Searchable => ({
  phones: [...(aboutUser.number ?? []), aboutUser.apartmentNumber === null ? key : null],
  apartment: aboutUser.apartmentNumber === null ? null : key,
  cars: aboutUser.carNumber,
  name: aboutUser.name,
});
