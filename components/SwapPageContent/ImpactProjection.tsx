import { Fieldset } from 'components/Fieldset';
import { formatPercentChange } from 'lib/numberFormat';
import { useMemo } from 'react';

import styles from './ImpactProjection.module.css';

export function ImpactProjection() {
  return (
    <Fieldset legend="🔮 Impact Projection">
      <p>
        Interest rate updates lag swaps due to the use of time-weighted values.
        Rates are modeled as if the price after the swap were to hold for 10
        minutes.
      </p>
      <div className={styles['projection-wrapper']}>
        <div className={styles.negative + ' ' + styles.right}>
          Projected:
          <br />
          -12.6%
        </div>
        <Direction direction="down" />
        <div className={styles.right}>
          Contract
          <br />
          Rate
          <br />
          -12.2%
        </div>
        <div className={styles.separator}>
          <span>.</span>
          <span>.</span>
          <span>.</span>
          <span className={styles.pipe}>|</span>
          <span className={styles.pipe}>|</span>
          <span className={styles.pipe}>|</span>
          <span className={styles.pipe}>|</span>
          <span className={styles.pipe}>|</span>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
        <div className={styles['pointers']}>
          <div>
            <Pointer kind="market" price="1.26 USDC" />
            <PriceProjection amount="1.31" percentChange={0.0323} />
          </div>
          <div>
            <Pointer kind="target" price="1.13 USDC" />
            <PriceProjection amount="1.09" percentChange={-0.0212} />
          </div>
        </div>
      </div>
    </Fieldset>
  );
}

interface DirectionProps {
  direction: 'up' | 'down';
}
function Direction({ direction }: DirectionProps) {
  const symbols = useMemo(
    () => new Array(3).fill(direction === 'down' ? 'v' : '^'),
    [direction],
  );
  return (
    <div className={styles.direction}>
      {symbols.map((s, i) => (
        <span key={i}>{s}</span>
      ))}
    </div>
  );
}

interface PointerProps {
  kind: 'market' | 'target';
  price: string;
}
function Pointer({ kind, price }: PointerProps) {
  return (
    <div className={styles['pointer-wrapper']}>
      <span className={styles['pointer-arrow']}>&lt;</span>
      <span>
        {kind.charAt(0).toUpperCase() + kind.slice(1)} Price
        <br />
        {price}
      </span>
    </div>
  );
}

interface PriceProjectionProps {
  amount: string;
  percentChange: number;
}
function PriceProjection({ amount, percentChange }: PriceProjectionProps) {
  return (
    <div className={styles[percentChange < 0 ? 'negative' : 'positive']}>
      Projected:
      <br />
      {amount} ({formatPercentChange(percentChange)})
    </div>
  );
}
