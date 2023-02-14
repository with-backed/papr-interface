import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useBlockNumber, useWebSocketProvider } from 'wagmi';

type TimestampResult = {
  blockNumber: number;
  timestamp: number;
};

/**
 * Exported only for use in stories. Please use TimestampProvider.
 */
export const TimestampContext = createContext<TimestampResult | null>(null);

export function TimestampProvider({ children }: PropsWithChildren<{}>) {
  const { jsonRpcProvider } = useConfig();
  const webSocketProvider = useWebSocketProvider();
  const [result, setResult] = useState<TimestampResult | null>(null);

  // Get the latest block number right away instead of waiting for the
  // websocket. Only run once, let the websocket take over after.
  const blockNumberResult = useBlockNumber({ watch: false });

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

  // For the first block number we fetch, get the timestamp
  const updateTimestamp = useCallback(
    async (blockNumber: number) => {
      const provider = new ethers.providers.JsonRpcProvider(jsonRpcProvider);
      const timestamp = await (await provider.getBlock(blockNumber)).timestamp;

      setResult((prev) => {
        // only set the result if nothing has come in over the websocket while
        // we were fetching.
        if (prev) {
          return prev;
        }
        return {
          blockNumber,
          timestamp,
        };
      });
    },
    [jsonRpcProvider],
  );

  useEffect(() => {
    if (blockNumberResult.data) {
      updateTimestamp(blockNumberResult.data);
    }
  }, [blockNumberResult, updateTimestamp]);

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
