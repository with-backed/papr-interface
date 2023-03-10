import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
import { useMemo } from 'react';

import { Fieldset } from './Common';
import { RatesNegative } from './RatesNegative';
import { RatesPositive } from './RatesPositive';

export function ContractStatus() {
  const { pricesData } = useControllerPricesData();
  const mark = useLatestMarketPrice();

  const [currentTarget, newTarget] = useMemo(() => {
    if (pricesData) {
      return pricesData.targetValues.slice(-2);
    }
    return [null, null];
  }, [pricesData]);

  const contractAPR = useMemo(() => {
    if (!currentTarget || !newTarget) {
      return null;
    }
    const change =
      (percentChange(currentTarget.value, newTarget.value) /
        (newTarget.time - currentTarget.time)) *
      SECONDS_IN_A_YEAR;
    return change;
  }, [currentTarget, newTarget]);

  if (!contractAPR || !mark) {
    return <Fieldset>Loading price data...</Fieldset>;
  }

  if (contractAPR < 0) {
    return (
      <RatesNegative
        contractRate={formatPercent(contractAPR)}
        marketPrice={formatTokenAmount(mark)}
        targetPrice={formatTokenAmount(newTarget!.value)}
      />
    );
  }

  return (
    <RatesPositive
      contractRate={formatPercent(contractAPR)}
      marketPrice={formatTokenAmount(mark)}
      targetPrice={formatTokenAmount(newTarget!.value)}
    />
  );
}
