import useResizeObserver from '@react-hook/resize-observer';
import { TextButton } from 'components/Button';
import { Fieldset as BaseFieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { pirsch } from 'lib/pirsch';
import {
  FunctionComponent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Disclosure, DisclosureStateReturn } from 'reakit/Disclosure';

import styles from './ContractStatus.module.css';

export type RatesProps = {
  contractRate: string;
  marketPrice: string;
  targetPrice: string;
};

export const Fieldset: FunctionComponent = ({ children }) => {
  return <BaseFieldset legend="🍜 Contract Status">{children}</BaseFieldset>;
};

type SummaryProps = {
  disclosureState: DisclosureStateReturn;
  contractRate: string;
  direction: 'negative' | 'positive';
};
export function Summary({
  disclosureState,
  direction,
  contractRate,
}: SummaryProps) {
  const adjustedContractRate = useMemo(
    // Design could not squeeze into normal table, this hack
    // avoids us having to reimplement percent formatting
    // for this one special case.
    () => contractRate.replace(/(\d+\.\d)(\d)(%)/, '$1$3'),
    [contractRate],
  );

  const toggle = useCallback(() => {
    const message = disclosureState.visible
      ? 'Contract status details collapsed'
      : 'Contract status details expanded';
    pirsch(message, {});
    disclosureState.toggle();
  }, [disclosureState]);

  return (
    <Table>
      <thead>
        <tr>
          <th className={styles.right}>Rate</th>
          <th className={styles.left + ' ' + styles.description}>Summary</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={styles.right}>
            {direction === 'positive' ? '🔥' : '🧊'} {adjustedContractRate}
          </td>
          <td className={styles.description}>
            {direction === 'positive'
              ? 'Contract is acting to raise Market Price'
              : 'Contract is acting to lower Market Price'}
          </td>
          <td className={styles.details}>
            <Disclosure as={TextButton} {...disclosureState} toggle={toggle}>
              {disclosureState.visible ? 'Collapse' : 'Expand'}
            </Disclosure>
          </td>
        </tr>
      </tbody>
    </Table>
  );
}

type PriceProps = {
  kind: 'market' | 'target';
  value: string;
};

export function Price({ kind, value }: PriceProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [top, setTop] = useState<number | null>(null);
  const label = useMemo(
    () => kind.charAt(0).toUpperCase() + kind.slice(1),
    [kind],
  );
  const style = useMemo(() => (top ? { top } : { display: 'none' }), [top]);

  const position = useCallback(() => {
    if (ref.current) {
      const parent = ref.current.closest(`.${styles.chart}`);
      const target = parent?.querySelector(
        `span[data-pointer-target="${kind}"]`,
      );
      if (target instanceof HTMLElement) {
        setTop(target.offsetTop);
      }
    }
  }, [kind]);

  useLayoutEffect(() => {
    position();
  }, [position]);

  useResizeObserver(
    (ref.current?.closest(`.${styles.chart}`) || null) as HTMLElement | null,
    position,
  );

  return (
    <span ref={ref} className={styles.price} style={style}>
      {label} Price &gt;
      <br />
      {value} WETH
    </span>
  );
}
