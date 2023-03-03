import { useMemo } from 'react';

import styles from './HealthBar.module.css';

const DEFAULT_NUM_SEGMENTS = 16;
const DEFAULT_UNHEALTHY_THRESHOLD = 0.85;

type HealthBarProps = {
  numSegments?: number;
  ratio: number;
  threshold?: number;
};

export function HealthBar({
  numSegments = DEFAULT_NUM_SEGMENTS,
  ratio,
  threshold = DEFAULT_UNHEALTHY_THRESHOLD,
}: HealthBarProps) {
  const segments = useMemo(() => {
    // Ratio, but as a number out of numSegments rather than a decimal out of 1
    const numFilledSegments = Math.round(ratio * numSegments);

    const empty = Array<string>(numSegments).fill('░');
    const filled = Array<string>(numFilledSegments).fill('▓');

    return filled.concat(empty).slice(0, numSegments).join('');
  }, [numSegments, ratio]);

  return (
    <span
      className={
        ratio > threshold ? styles['indicator-danger'] : styles.indicator
      }>
      {segments}
    </span>
  );
}
