import { TimeSeriesValue } from 'lib/strategies/charts';
import { getTimestampNDaysAgo } from 'lib/duration';

export function percentChange(v1: number, v2: number) {
  return (v2 - v1) / v1;
}

export function getValueDaysAgo(values: TimeSeriesValue[], daysAgo: number) {
  const pastTimestamp = getTimestampNDaysAgo(daysAgo);
  return values.reduce((prev, curr) => {
    const prevDiff = Math.abs(pastTimestamp - prev.time);
    const currDiff = Math.abs(pastTimestamp - curr.time);
    if (currDiff < prevDiff) {
      return curr;
    }
    return prev;
  }, values[0]);
}

export function percentChangeOverDuration(
  timeSeriesValues: TimeSeriesValue[],
  durationDays: number,
) {
  const v1 = getValueDaysAgo(timeSeriesValues, durationDays);
  const v2 = timeSeriesValues[timeSeriesValues.length - 1];
  return percentChange(v1.value, v2.value);
}
