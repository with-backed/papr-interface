import { ethers } from 'ethers';
import { PaprController } from 'lib/PaprController';
import { ControllerPricesData } from 'lib/controllers/charts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './OpenVault.module.css';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';

type VaultMathProps = {
  controller: PaprController;
  pricesData: ControllerPricesData;
  oracleValue: string;
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
  controller,
  pricesData,
  oracleValue,
  quoteForSwap,
  inputtedLTV,
  showMath,
}: VaultMathProps) {
  const [maxDebt, setMaxDebt] = useState<string>('');

  const updateMaxDebt = useCallback(async () => {
    const newTarget = await controller.newTarget();
    const maxLTV = await controller.maxLTV();

    const maxDebt = maxLTV
      .mul(ethers.utils.parseUnits(oracleValue, controller.underlying.decimals))
      .div(newTarget);

    setMaxDebt(maxDebt.toString());
  }, [controller, oracleValue]);

  useEffect(() => {
    updateMaxDebt();
  }, [updateMaxDebt]);

  const debtTokenMarketPrice = useMemo(
    () => pricesData.markValues[pricesData.markValues.length - 1]?.value || 1.0,
    [pricesData],
  );
  const debtTokenControllerPrice = useMemo(
    () =>
      pricesData.targetValues[pricesData.targetValues.length - 1]?.value || 1.0,
    [pricesData],
  );

  const priceDifference = useMemo(() => {
    if (!debtTokenMarketPrice) return 0;
    return (
      Math.floor(
        (debtTokenMarketPrice / debtTokenControllerPrice - 1) * 10000,
      ) / 100
    );
  }, [debtTokenMarketPrice, debtTokenControllerPrice]);

  const effectiveOracleValue = useMemo(() => {
    return (1 - Math.abs(priceDifference / 100)) * parseFloat(oracleValue);
  }, [priceDifference, oracleValue]);

  const maxLTV = useAsyncValue(() => controller.maxLTVPercent(), [controller]);

  if (!showMath) return <></>;

  return (
    <div className={styles.mathWrapper}>
      <p className={styles.underlyingSymbol}>{controller.underlying.symbol}</p>
      <MathRow
        formula="M"
        description="Market $pAPR price"
        content={formatTokenAmount(debtTokenMarketPrice)}
        even
      />
      <MathRow
        formula="N"
        description="Controller contract's $pAPR price"
        content={formatTokenAmount(debtTokenControllerPrice)}
        even={false}
      />
      <MathRow
        formula="D = M/N - 1"
        description="Difference: market vs. controller"
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
        description="Controller valuation of collateral"
        content={effectiveOracleValue.toFixed(4)}
        even
      />
      <MathRow
        formula="K"
        description="Max LTV"
        content={`${formatPercent(maxLTV || 0)}`}
        even={false}
      />
      <MathRow
        formula="X = R*K"
        description="Max Borrowable"
        content={(effectiveOracleValue * (maxLTV || 0)).toFixed(4)}
        even
      />
      <MathRow
        formula="Y"
        description="Your loan amount"
        content={quoteForSwap}
        even={false}
      />
      <MathRow
        formula="Z = Y/X"
        description="Your LTV"
        content={`${formatPercent(parseFloat(inputtedLTV))}`}
        even
      />
    </div>
  );
}
