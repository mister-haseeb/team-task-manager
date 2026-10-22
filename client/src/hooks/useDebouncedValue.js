import { useEffect, useState } from 'react';

// Returns `value` once it has stopped changing for `delay` ms (used for search-as-you-type).
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
