'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { replaceQuery, useSearchParams } from '@/sharedLayer/framework/navigation';
import { isSearchMode, SearchMode } from './searchMatch';

export const SEARCH_QUERY_PARAM = 'q';
export const SEARCH_MODE_PARAM = 'by';

const STORED_MODE_KEY = 'search-mode';
// the address is rewritten when the typing pauses: browsers limit how often it may change
const WRITE_DELAY_MS = 250;

const readStoredMode = (): SearchMode | null => {
  try {
    const stored = window.localStorage.getItem(STORED_MODE_KEY);
    return isSearchMode(stored) ? stored : null;
  } catch {
    return null;
  }
};

// The search of a list lives in the address of the page (?q=067&by=phone), like the date: the field sits
// in the header, the list in the page, and they share nothing else. The mode is also remembered
// in the browser, an operator who searches by apartments does not choose it every time.
export const useListSearch = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get(SEARCH_QUERY_PARAM) ?? '';
  const modeParam = searchParams.get(SEARCH_MODE_PARAM);

  const [storedMode, setStoredMode] = useState<SearchMode>('all');
  useEffect(() => setStoredMode(readStoredMode() ?? 'all'), []);

  const mode: SearchMode = isSearchMode(modeParam) ? modeParam : storedMode;

  // what is typed is shown at once, the address (and with it the list) follows after a pause
  const [text, setText] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastWritten = useRef(query);

  useEffect(() => {
    // the address was changed by something else (back button, a link): the field follows
    if (query !== lastWritten.current) {
      lastWritten.current = query;
      setText(query);
    }
  }, [query]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const write = useCallback((nextQuery: string, nextMode: SearchMode) => {
    const params = new URLSearchParams(window.location.search);

    if (nextQuery.trim()) params.set(SEARCH_QUERY_PARAM, nextQuery);
    else params.delete(SEARCH_QUERY_PARAM);

    if (nextMode !== 'all' && nextQuery.trim()) params.set(SEARCH_MODE_PARAM, nextMode);
    else params.delete(SEARCH_MODE_PARAM);

    lastWritten.current = nextQuery.trim() ? nextQuery : '';
    replaceQuery(params.toString());
  }, []);

  const setQuery = useCallback((value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => write(value, mode), WRITE_DELAY_MS);
  }, [write, mode]);

  const setMode = useCallback((value: SearchMode) => {
    setStoredMode(value);
    try { window.localStorage.setItem(STORED_MODE_KEY, value); } catch { /* private mode */ }
    clearTimeout(timer.current);
    write(text, value);
  }, [write, text]);

  const clear = useCallback(() => {
    setText('');
    clearTimeout(timer.current);
    write('', mode);
  }, [write, mode]);

  return { query, mode, text, setQuery, setMode, clear };
};
