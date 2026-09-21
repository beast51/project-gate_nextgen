// How the lists (gate users, calls, violations) are searched. One field, four modes.
export const SEARCH_MODES = ['all', 'phone', 'apartment', 'car'] as const;

export type SearchMode = typeof SEARCH_MODES[number]

export const isSearchMode = (value: unknown): value is SearchMode =>
  (SEARCH_MODES as readonly unknown[]).includes(value);

// what a card of any list can be found by
export type Searchable = {
  phones: (string | null | undefined)[]
  apartment?: string | null
  cars?: (string | null | undefined)[] | null
  name?: string | null
}

// Letters of a number plate that look the same in both alphabets: operators type "ВН" with either keyboard
const CYRILLIC_LOOKALIKES: Record<string, string> = {
  'А': 'A', 'В': 'B', 'Е': 'E', 'І': 'I', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'У': 'Y',
};

// "вн 1096-іс" -> "BH1096IC"
const normalizePlate = (value: string) =>
  value.toUpperCase().replace(/[^\p{L}\p{N}]/gu, '').replace(/[А-ЯІ]/g, letter => CYRILLIC_LOOKALIKES[letter] ?? letter);

const digitsOf = (value: string) => value.replace(/\D/g, '');

// a phone number is stored as 380674821822 and shown as 067-482-1822: only the digits are compared
const matchesPhone = ({ phones }: Searchable, query: string) => {
  const digits = digitsOf(query);
  return digits.length > 0 && phones.some(phone => digitsOf(phone ?? '').includes(digits));
};

// by the beginning: "12" finds 12, 120 and 12A, not 312
const matchesApartment = ({ apartment }: Searchable, query: string) => {
  const wanted = normalizePlate(query);
  return wanted.length > 0 && normalizePlate(apartment ?? '').startsWith(wanted);
};

const matchesCar = ({ cars }: Searchable, query: string) => {
  const wanted = normalizePlate(query);
  return wanted.length > 0 && (cars ?? []).some(car => normalizePlate(car ?? '').includes(wanted));
};

const matchesName = ({ name }: Searchable, query: string) =>
  (name ?? '').toLowerCase().includes(query.trim().toLowerCase());

const looksLikePhone = (query: string) => /^[\d\s()+-]+$/.test(query);

export const matchesSearch = (item: Searchable, query: string, mode: SearchMode = 'all'): boolean => {
  if (!query.trim()) return true;

  switch (mode) {
    case 'phone': return matchesPhone(item, query);
    case 'apartment': return matchesApartment(item, query);
    case 'car': return matchesCar(item, query);
    default:
      return matchesName(item, query)
        || matchesCar(item, query)
        || matchesApartment(item, query)
        // "BH 1096" is a number plate: its digits are not looked for in the phone numbers
        || (looksLikePhone(query) && matchesPhone(item, query));
  }
};
