import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
import { useMemo } from 'react';

import { Fieldset } from './Common';
import { RatesNegative } from './RatesNegative';
import { RatesPositive } from './RatesPositive';

export function ContractStatus() {
  const {
    pricesData,
    fetching: pricesDataFetching,
    error: pricesDataError,
  } = useControllerPricesData();
  const contractAPR = useMemo(() => {
    if (!pricesData || pricesData.targetValues.length < 2) {
      return null;
    }
    const l = pricesData.targetValues.length;
    const cur = pricesData.targetValues[l - 1];
    const prev = pricesData.targetValues[l - 2];
    const change = percentChange(prev.value, cur.value);
    console.log({
      cur: cur.value,
      prev: prev.value,
      change,
    });
    // convert to APR
    return (change / (cur.time - prev.time)) * SECONDS_IN_A_YEAR;
  }, [pricesData]);

  const { mark, target } = useMemo(() => {
    if (!pricesData) {
      return {
        mark: 0,
        target: 0,
      };
    }
    const { markValues, targetValues } = pricesData;
    // This happens on a brand new controller that doesn't have data yet.
    if (markValues.length === 0 || targetValues.length === 0) {
      return {
        mark: 0,
        target: 0,
      };
    }
    const mark = markValues[markValues.length - 1].value;
    const target = targetValues[targetValues.length - 1].value;
    return { mark, target };
  }, [pricesData]);

  if (pricesDataFetching) {
    return <Fieldset>Loading price data...</Fieldset>;
  }

  if (pricesDataError || !contractAPR) {
    return <Fieldset>Failed to load price data.</Fieldset>;
  }

  if (contractAPR < 0) {
    return (
      <RatesNegative
        contractRate={formatPercent(contractAPR)}
        marketPrice={formatTokenAmount(mark)}
        targetPrice={formatTokenAmount(target)}
      />
    );
  }

  return (
    <RatesPositive
      contractRate={formatPercent(contractAPR)}
      marketPrice={formatTokenAmount(mark)}
      targetPrice={formatTokenAmount(target)}
    />
  );
}
