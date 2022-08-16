import { ethers } from 'ethers';
import { LendingStrategy } from 'lib/strategies';
import { ONE } from 'lib/strategies/constants';
import { useState, useCallback, useEffect } from 'react';

export default function StrategyState({
  strategy,
}: {
  strategy: LendingStrategy;
}) {
  const [strategyIndex, setStrategyIndex] = useState<string>('');
  const [strategyMultiplier, setStrategyMultiplier] = useState<string>('');

  const updateStrategyIndex = useCallback(async () => {
    const index = await strategy.contract.index();
    setStrategyIndex(ethers.utils.formatEther(index));
  }, [strategy]);

  const updateStrategyMultiplier = useCallback(async () => {
    try {
      const multiplier = await strategy.contract.targetMultiplier();
      setStrategyMultiplier(ethers.utils.formatEther(multiplier));
    } catch {
      // this is erroring on first load. i think some liquidity issue
    }
  }, [strategy]);

  useEffect(() => {
    updateStrategyIndex();
    updateStrategyMultiplier();
  });

  return (
    <fieldset>
      <legend>Strategy State</legend>
      <p>Index: {strategyIndex}</p>
      <p>Multiplier: {strategyMultiplier}</p>
      <p>
        Strategy&apos;s Current APR:{' '}
        {parseFloat(strategy.currentAPRBIPs.toString()) / 100} %
      </p>
      <p>
        Strategy&apos;s Target APR:{' '}
        {parseFloat(
          strategy.targetGrowthPerPeriod.mul(52).div(ONE.div(10000)).toString(),
        ) / 100}{' '}
        %
      </p>
    </fieldset>
  );
}
