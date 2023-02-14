import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useWebSocketProvider } from 'wagmi';

type TimestampResult = {
  blockNumber: number;
  timestamp: number;
};

/**
 * Exported only for use in stories. Please use TimestampProvider.
 */
export const TimestampContext = createContext<TimestampResult | null>(null);

export function TimestampProvider({ children }: PropsWithChildren<{}>) {
  const webSocketProvider = useWebSocketProvider();
  const [result, setResult] = useState<TimestampResult | null>(null);

  useEffect(() => {
    webSocketProvider?._subscribe('newHeads', ['newHeads'], (result) => {
      if (result && result.number && result.timestamp) {
        const { number, timestamp } = result;
        setResult({
          blockNumber: parseInt(number, 16),
          timestamp: parseInt(timestamp, 16),
        });
      }
    });
  }, [webSocketProvider]);

  return (
    <TimestampContext.Provider value={result}>
      {children}
    </TimestampContext.Provider>
  );
}

export function useTimestamp() {
  const timestamp = useContext(TimestampContext);
  return timestamp;
}
