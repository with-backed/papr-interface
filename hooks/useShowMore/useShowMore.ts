import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Faux pagination for components where we've already downloaded the full
 * set of data, but don't want to show the whole thing in one go.
 * @param allData
 * @param increment the amount by which the paginated view should increase
 */
export function useShowMore<T>(allData: T[], increment = 5) {
  const [feed, setFeed] = useState<T[]>([]);
  const [remaining, setRemaining] = useState<T[]>([]);

  const showMore = useCallback(() => {
    const nextFive = remaining.slice(0, increment);
    setRemaining((prev) => prev.slice(increment));
    setFeed((prev) => prev.concat(nextFive));
  }, [increment, remaining]);

  const amountThatWillShowNext = useMemo(
    () => Math.min(increment, remaining.length),
    [increment, remaining],
  );

  useEffect(() => {
    if (allData.length > 0) {
      setFeed(allData.slice(0, increment));
      setRemaining(allData.slice(increment));
    }
  }, [allData, increment]);

  return {
    amountThatWillShowNext,
    feed,
    showMore,
    remainingLength: remaining.length,
  };
}
