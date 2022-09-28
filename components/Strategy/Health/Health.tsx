import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useMemo } from 'react';

export type HealthProps = {
  pricesData: StrategyPricesData;
};

export function Health({
  pricesData: { index, markValues, normalizationValues },
}: HealthProps) {
  const { markPosition, normPosition } = useMemo(() => {
    const mark = parseFloat(markValues[markValues.length - 1]);
    const norm = parseFloat(
      normalizationValues[normalizationValues.length - 1],
    );
    const indexVersusMark = percentDiff(index, mark);
    const indexVersusNorm = percentDiff(index, norm);

    let markPosition = diffToPosition(indexVersusMark, index, mark);
    const normPosition = diffToPosition(indexVersusNorm, index, norm);

    if (markPosition === normPosition) {
      markPosition++;
    }

    return { markPosition, normPosition };
  }, [index, markValues, normalizationValues]);

  return (
    <span>
      {['-', '-', '-', '-', '|', '-', '-', '-', '-'].map((char, i) => (
        <span key={char + i}>
          {markPosition === i && <>R</>}
          {normPosition === i && <>C</>}
          {markPosition !== i && normPosition !== i && <>{char}</>}
        </span>
      ))}
    </span>
  );
}

const percentDiff = (a: number, b: number): number =>
  Math.abs(((b - a) / a) * 100);

const diffToPosition = (diff: number, index: number, val: number) => {
  if (val <= index) {
    if (diff < 5) {
      return 0;
    } else if (diff < 10) {
      return 1;
    } else if (diff < 15) {
      return 2;
    } else {
      return 3;
    }
  } else {
    if (diff < 5) {
      return 5;
    } else if (diff < 10) {
      return 6;
    } else if (diff < 15) {
      return 7;
    } else {
      return 8;
    }
  }
};
