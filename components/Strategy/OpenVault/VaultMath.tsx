import { ethers } from 'ethers';
import {
  getOracleValueForStrategy,
  getDebtTokenMarketPrice,
  getDebtTokenStrategyPrice,
  LendingStrategy,
} from 'lib/strategies';
import { StrategyPricesData } from 'lib/strategies/charts';
import { ONE, PRICE } from 'lib/strategies/constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './OpenVault.module.css';

type VaultMathProps = {
  strategy: LendingStrategy;
  pricesData: StrategyPricesData;
  quoteForSwap: string;
  inputtedLTV: string;
  showMath: boolean;
};

type MathRowProps = {
  formula: string;
  description: string;
  content: string | undefined;
  even: boolean;
};

function MathRow({ formula, description, content, even }: MathRowProps) {
  return (
    <div className={`${even ? styles.even : ''} ${styles.mathRow}`}>
      <div className={styles.formula}>
        <p>{formula}</p>
      </div>
      <div className={styles.description}>
        <p>{description}</p>
      </div>
      <div className={styles.content}>
        <p>{content}</p>
      </div>
    </div>
  );
}

export default function VaultMath({
  strategy,
  pricesData,
  quoteForSwap,
  inputtedLTV,
  showMath,
}: VaultMathProps) {
  const [oracleValue, setOracleValue] = useState<string>('');
  const [maxDebt, setMaxDebt] = useState<string>('');

  const updateOracleValue = useCallback(async () => {
    const value = await getOracleValueForStrategy(strategy);
    setOracleValue(value.toFixed());
  }, [strategy]);

  const updateMaxDebt = useCallback(async () => {
    const newNorm = await strategy.contract.newNorm();
    const maxLTV = await strategy.contract.maxLTV();

    const maxDebt = maxLTV.mul(ethers.BigNumber.from(PRICE)).div(newNorm);

    setMaxDebt(maxDebt.toString());
  }, [strategy]);

  useEffect(() => {
    updateOracleValue();
    updateMaxDebt();
  }, [updateMaxDebt, updateOracleValue]);

  const debtTokenMarketPrice = useMemo(
    () => pricesData.markValues[pricesData.markValues.length - 1] || '1.0000',
    [pricesData],
  );
  const debtTokenStrategyPrice = useMemo(
    () =>
      pricesData.normalizationValues[pricesData.normalizationValues.length - 1],
    [pricesData],
  );

  const priceDifference = useMemo(() => {
    if (!debtTokenMarketPrice) return 0;
    return (
      Math.floor(
        (parseFloat(debtTokenMarketPrice) / parseFloat(debtTokenStrategyPrice) -
          1) *
          10000,
      ) / 100
    );
  }, [debtTokenMarketPrice, debtTokenStrategyPrice]);

  const effectiveOracleValue = useMemo(() => {
    return (1 - Math.abs(priceDifference / 100)) * parseFloat(oracleValue);
  }, [priceDifference, oracleValue]);

  const maxLTV = useMemo(() => {
    return strategy.maxLTVPercent;
  }, [strategy]);

  if (!showMath) return <></>;

  return (
    <div className={styles.mathWrapper}>
      <p className={styles.underlyingSymbol}>{strategy.underlying.symbol}</p>
      <MathRow
        formula="M"
        description="Market $pAPR price"
        content={parseFloat(debtTokenMarketPrice || '').toFixed(4)}
        even
      />
      <MathRow
        formula="N"
        description="Strategy contract's $pAPR price"
        content={parseFloat(debtTokenStrategyPrice).toFixed(4)}
        even={false}
      />
      <MathRow
        formula="D = M/N - 1"
        description="Difference: market vs. strategy"
        content={`${priceDifference.toFixed(4)}%`}
        even
      />
      <MathRow
        formula="C"
        description="Oracle value of your collateral"
        content={parseFloat(oracleValue).toFixed(4)}
        even={false}
      />
      <MathRow
        formula="R = D * C"
        description="Strategy valuation of collateral"
        content={effectiveOracleValue.toFixed(4)}
        even
      />
      <MathRow
        formula="K"
        description="Max LTV"
        content={`${maxLTV.toFixed(4)}%`}
        even={false}
      />
      <MathRow
        formula=""
        description="Max Borrowable"
        content={(effectiveOracleValue * (maxLTV / 100)).toFixed(4)}
        even
      />
      <MathRow
        formula=""
        description="Your loan amount"
        content={quoteForSwap}
        even={false}
      />
      <MathRow
        formula=""
        description="Your LTV"
        content={`${inputtedLTV}%`}
        even
      />
    </div>
  );
}
