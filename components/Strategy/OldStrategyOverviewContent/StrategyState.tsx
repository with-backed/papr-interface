import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { StrategyPricesData } from 'lib/strategies/charts';
import {
  getDebtTokenMarketPrice,
  getDebtTokenStrategyPrice,
} from 'lib/strategies';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { LendingStrategy } from 'lib/LendingStrategy';

export default function StrategyState({
  strategy,
  pricesData,
}: {
  strategy: LendingStrategy;
  pricesData: StrategyPricesData;
}) {
  const [strategyIndex, setStrategyIndex] = useState<string>('');
  const [strategyMultiplier, setStrategyMultiplier] = useState<string>('');
  const [strategyNormalization, setStrategyNormalization] =
    useState<string>('');

  const updateStrategyIndex = useCallback(async () => {
    const index = await strategy.index();
    setStrategyIndex(ethers.utils.formatEther(index));
  }, [strategy]);

  const updateStrategyNormalization = useCallback(async () => {
    const norm = await getDebtTokenStrategyPrice(strategy);
    setStrategyNormalization(ethers.utils.formatEther(norm));
  }, [strategy]);

  const updateStrategyMultiplier = useCallback(async () => {
    try {
      const multiplier = await strategy.multiplier();
      setStrategyMultiplier(ethers.utils.formatEther(multiplier));
    } catch {
      // this is erroring on first load. i think some liquidity issue
    }
  }, [strategy]);

  const debtPrice = useMemo(() => {
    const price = getDebtTokenMarketPrice(strategy);
    if (!price) return '';
    return (1).toFixed(2);
  }, [strategy]);

  useEffect(() => {
    updateStrategyIndex();
    updateStrategyMultiplier();
    updateStrategyNormalization();
  }, [
    updateStrategyIndex,
    updateStrategyMultiplier,
    updateStrategyNormalization,
  ]);

  return (
    <Fieldset legend="📈 Strategy State">
      <p>
        {' '}
        Target Exchange Rate: 1 dt = {strategyIndex}{' '}
        {strategy.underlying.symbol}
      </p>
      <p>
        {' '}
        Contract Exchange Rate: 1 dt = {strategyNormalization}{' '}
        {strategy.underlying.symbol}
      </p>
      <p>
        {' '}
        Uniswap Exchange Rate: 1 dt = {debtPrice} {strategy.underlying.symbol}
      </p>
      <p>
        Difference: Market vs. Strategy{' '}
        {Math.floor(
          (parseFloat(debtPrice) / parseFloat(strategyNormalization) - 1) *
            10000,
        ) / 100}
        %{' '}
      </p>
      <p> Target Daily Percentage Growth {pricesData.indexDPR}%</p>
      <p>
        {' '}
        Current Contract Daily Percentage Growth{' '}
        {
          pricesData.normalizationDPRValues[
            pricesData.normalizationDPRValues.length - 1
          ][0]
        }
        %
      </p>
      <p>
        {' '}
        Realized Market Daily Percentage Growth{' '}
        {pricesData.markDPRValues[pricesData.markDPRValues.length - 1][0]}%
      </p>
    </Fieldset>
  );
}
