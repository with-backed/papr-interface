import useResizeObserver from '@react-hook/resize-observer';
import { TextButton } from 'components/Button';
import { Fieldset as BaseFieldset } from 'components/Fieldset';
import {
  FunctionComponent,
  PropsWithChildren,
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
};
export function Summary({
  children,
  disclosureState,
}: PropsWithChildren<SummaryProps>) {
  return (
    <div className={styles.summary}>
      {children}
      <Disclosure as={TextButton} {...disclosureState}>
        {disclosureState.visible ? 'Collapse' : 'Expand'}
      </Disclosure>
    </div>
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
      {value} USDC
    </span>
  );
}
