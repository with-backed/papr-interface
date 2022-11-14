import { TimeSeriesValue } from 'lib/controllers/charts';
import { getTimestampNDaysAgo } from 'lib/duration';
import sortedIndex from 'lodash/sortedIndex';

export function percentChange(v1: number, v2: number) {
  return (v2 - v1) / v1;
}

/**
 * Finds the index of value in `haystack` which is closest to `needle`.
 * @param haystack
 * @param needle
 */
export function findIndexOfClosest(haystack: number[], needle: number) {
  // binary search to find the lowest index where this value would be inserted
  // in a sorted list
  const index = sortedIndex(haystack, needle);

  // Cases where there is only one adjacent value
  if (index === 0) {
    return 0;
  }
  if (index === haystack.length || index === haystack.length - 1) {
    return index - 1;
  }

  // General case where new index is flanked by 2 values
  const lower = haystack[index - 1];
  const higher = haystack[index];
  const lowerDiff = needle - lower;
  const higherDiff = higher - needle;
  if (lowerDiff < higherDiff) {
    return index - 1;
  }
  return index;
}

export function getValueDaysAgo(values: TimeSeriesValue[], daysAgo: number) {
  const timestamps = values.map((v) => v.time);
  const pastTimestamp = getTimestampNDaysAgo(daysAgo);
  const indexOfClosest = findIndexOfClosest(timestamps, pastTimestamp);

  return values[indexOfClosest];
}

export function percentChangeOverDuration(
  timeSeriesValues: TimeSeriesValue[],
  durationDays: number,
) {
  const v1 = getValueDaysAgo(timeSeriesValues, durationDays);
  const v2 = timeSeriesValues[timeSeriesValues.length - 1];
  return percentChange(v1.value, v2.value);
}
