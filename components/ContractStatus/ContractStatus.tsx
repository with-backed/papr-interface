import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useTarget } from 'hooks/useTarget';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
import { useMemo } from 'react';

import { Fieldset } from './Common';
import { RatesNegative } from './RatesNegative';
import { RatesPositive } from './RatesPositive';

export function ContractStatus() {
  const { target: currentTarget, lastUpdated, underlying } = useController();
  const newTargetResult = useTarget();
  const mark = useLatestMarketPrice();

  const currentTargetNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(currentTarget, underlying.decimals),
    );
  }, [currentTarget, underlying.decimals]);
  const newTargetNumber = useMemo(() => {
    if (!newTargetResult) {
      return null;
    }
    return parseFloat(
      ethers.utils.formatUnits(newTargetResult.newTarget, underlying.decimals),
    );
  }, [newTargetResult, underlying.decimals]);

  const contractAPR = useMemo(() => {
    if (!newTargetResult || !newTargetNumber) {
      return null;
    }
    const change = percentChange(currentTargetNumber, newTargetNumber);
    // convert to APR
    return (
      (change / (newTargetResult.timestamp - lastUpdated)) * SECONDS_IN_A_YEAR
    );
  }, [newTargetNumber, lastUpdated, currentTargetNumber, newTargetResult]);

  if (!contractAPR || !mark) {
    return <Fieldset>Loading price data...</Fieldset>;
  }

  if (contractAPR < 0) {
    return (
      <RatesNegative
        contractRate={formatPercent(contractAPR)}
        marketPrice={formatTokenAmount(mark)}
        targetPrice={formatTokenAmount(newTargetNumber!)}
      />
    );
  }

  return (
    <RatesPositive
      contractRate={formatPercent(contractAPR)}
      marketPrice={formatTokenAmount(mark)}
      targetPrice={formatTokenAmount(newTargetNumber!)}
    />
  );
}
