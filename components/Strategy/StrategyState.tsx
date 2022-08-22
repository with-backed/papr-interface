import { ethers } from 'ethers';
import { LendingStrategy } from 'lib/strategies';
import { ONE } from 'lib/strategies/constants';
import { useState, useCallback, useEffect, useMemo } from 'react';

export default function StrategyState({
  strategy,
}: {
  strategy: LendingStrategy;
}) {
  const [strategyIndex, setStrategyIndex] = useState<string>('');
  const [strategyMultiplier, setStrategyMultiplier] = useState<string>('');
  const [strategyNormalization, setStrategyNormalization] =
    useState<string>('');

  const updateStrategyIndex = useCallback(async () => {
    const index = await strategy.contract.index();
    setStrategyIndex(ethers.utils.formatEther(index));
  }, [strategy]);

  const updateStrategyNormalization = useCallback(async () => {
    const norm = await strategy.contract.newNorm();
    setStrategyNormalization(ethers.utils.formatEther(norm));
  }, [strategy]);

  const updateStrategyMultiplier = useCallback(async () => {
    try {
      const multiplier = await strategy.contract.multiplier();
      setStrategyMultiplier(ethers.utils.formatEther(multiplier));
    } catch {
      // this is erroring on first load. i think some liquidity issue
    }
  }, [strategy]);

  const debtPrice = useMemo(() => {
    if (strategy == null) {
      return '';
    }
    return strategy.token0IsUnderlying
      ? strategy.pool.token1Price.toFixed()
      : strategy.pool.token0Price.toFixed();
  }, [strategy]);

  useEffect(() => {
    updateStrategyIndex();
    updateStrategyMultiplier();
    updateStrategyNormalization();
  });

  return (
    <fieldset>
      <legend>Strategy State</legend>
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
      {/* <p>Multiplier: {strategyMultiplier}</p> */}
      <p>
        Strategy&apos;s Current APR:{' '}
        {parseFloat(strategy.currentAPRBIPs.toString()) / 100} %
      </p>
      <p>
        Strategy&apos;s Target APR:{' '}
        {parseFloat(strategy.targetAnnualGrowth.toString()) / 100} %
      </p>
    </fieldset>
  );
}
