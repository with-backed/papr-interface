import { ethers } from 'ethers';
import { LendingStrategy } from 'lib/strategies';
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
    </fieldset>
  );
}
