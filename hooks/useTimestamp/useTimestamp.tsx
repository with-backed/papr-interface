import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

const TIMESTAMP_POLL_INTERVAL = 14000;

/**
 * Get an approximation of the current block timestamp.
 * @returns timestamp 15 seconds ago
 */
function getTimestamp() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - 15;
}

/**
 * Exported only for use in stories. Please use TimestampProvider.
 */
export const TimestampContext = createContext<number>(getTimestamp());

export function TimestampProvider({
  children,
}: PropsWithChildren<Record<never, any>>) {
  const [timestamp, setTimestamp] = useState<number>(getTimestamp);

  useEffect(() => {
    const setLatestTimestamp = async () => {
      setTimestamp(getTimestamp());
    };
    setLatestTimestamp();
    const intervalId = setInterval(setLatestTimestamp, TIMESTAMP_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [setTimestamp]);

  return (
    <TimestampContext.Provider value={timestamp}>
      {children}
    </TimestampContext.Provider>
  );
}

export function useTimestamp() {
  const timestamp = useContext(TimestampContext);
  return timestamp;
}
