import { useEffect, useState } from 'react';

export function useAsyncValue<T>(
  callback: () => Promise<T | null>,
  deps: any[],
): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    callback().then(setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
