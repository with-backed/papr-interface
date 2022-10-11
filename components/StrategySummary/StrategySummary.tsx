import { Fieldset } from 'components/Fieldset';
import { Health } from 'components/Strategies/Health';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy } from 'lib/LendingStrategy';
import { formatPercent, formatThreeFractionDigits } from 'lib/numberFormat';
import { StrategyPricesData } from 'lib/strategies/charts';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TooltipReference, TooltipStateReturn, useTooltipState } from 'reakit';

import styles from './strategySummary.module.css';
import {
  APRTooltip,
  MktCtrTooltip,
  NFTCapTooltip,
  RateTooltip,
  TokenTooltip,
} from './Tooltips';

export type StrategySummaryProps = {
  strategies: LendingStrategy[];
  pricesData: { [key: string]: StrategyPricesData | null };
  includeDetails: boolean;
  legend: string;
};

export default function StrategySummary({
  strategies,
  pricesData,
  includeDetails,
  legend,
}: StrategySummaryProps) {
  const config = useConfig();
  const router = useRouter();
  const [debtTokenSupplies, setDebtTokenSupplies] = useState<{
    [key: string]: ethers.BigNumber;
  }>({});
  const [debtTokenSuppliesLoading, setDebtTokenSuppliesLoading] =
    useState<boolean>(true);

  const initDebtTokenSupplies = useCallback(async () => {
    const totalSupplies = await Promise.all(
      strategies.map((strategy) =>
        strategy.token0IsUnderlying
          ? strategy.token1.totalSupply()
          : strategy.token0.totalSupply(),
      ),
    );
    for (let i = 0; i < totalSupplies.length; i++) {
      setDebtTokenSupplies((prev) => ({
        ...prev,
        [strategies[i].id]: totalSupplies[i],
      }));
    }
    setDebtTokenSuppliesLoading(false);
  }, [strategies]);

  useEffect(() => {
    initDebtTokenSupplies();
  }, [initDebtTokenSupplies]);

  const tokenTooltip = useTooltipState({ placement: 'bottom-start' });
  const aprTooltip = useTooltipState({ placement: 'bottom-start' });
  const nftCapTooltip = useTooltipState({ placement: 'bottom-start' });
  const mktCtrTooltip = useTooltipState({ placement: 'bottom-start' });
  const rateTooltip = useTooltipState({ placement: 'bottom-start' });

  if (debtTokenSuppliesLoading) return <></>;

  return (
    <Fieldset legend={legend}>
      <div className={styles.strategies}>
        <table className={styles.table}>
          <thead>
            <tr>
              {!includeDetails && (
                <th className={styles.tokenName}>
                  <p>token</p>
                </th>
              )}
              <th className={styles.stat}>
                <p>target</p>
              </th>
              <th className={styles.stat}>
                <p>NFT/CAP</p>
              </th>
              <th className={styles.stat}>
                <p>MKT/CTR</p>
              </th>
              <th className={styles.rate}>
                <p>RATE</p>
              </th>
              {includeDetails && <th colSpan={6}></th>}
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy, i) => (
              <SummaryEntry
                key={strategy.id}
                tokenTooltip={tokenTooltip}
                aprTooltip={aprTooltip}
                nftCapTooltip={nftCapTooltip}
                mktCtrTooltip={mktCtrTooltip}
                rateTooltip={rateTooltip}
                pricesData={pricesData[strategy.id]}
                strategy={strategy}
                includeDetails={includeDetails}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Fieldset>
  );
}

type SummaryEntryProps = {
  tokenTooltip: TooltipStateReturn;
  aprTooltip: TooltipStateReturn;
  nftCapTooltip: TooltipStateReturn;
  mktCtrTooltip: TooltipStateReturn;
  rateTooltip: TooltipStateReturn;
  pricesData: StrategyPricesData | null;
  strategy: LendingStrategy;
  includeDetails?: boolean;
};
function SummaryEntry({
  tokenTooltip,
  aprTooltip,
  nftCapTooltip,
  mktCtrTooltip,
  rateTooltip,
  strategy,
  pricesData,
  includeDetails,
}: SummaryEntryProps) {
  const { network } = useConfig();
  const debtTokenSupply = useAsyncValue(
    () =>
      strategy.token0IsUnderlying
        ? strategy.token1.totalSupply()
        : strategy.token0.totalSupply(),
    [strategy],
  );

  if (!pricesData) return <></>;

  const mark = parseFloat(
    pricesData.markValues[pricesData.markValues.length - 1],
  );
  const norm = parseFloat(
    pricesData.normalizationValues[pricesData.normalizationValues.length - 1],
  );
  const markOverNorm = mark / norm;

  const fakeNFTValue = 300000;
  const debtTokenMarketCap =
    parseFloat(ethers.utils.formatEther(debtTokenSupply || 0)) * mark;

  const nftOverCap = fakeNFTValue / debtTokenMarketCap;

  return (
    <tr>
      {!includeDetails && (
        <td className={styles.tokenName}>
          <TooltipReference {...tokenTooltip}>
            <p>$papr_${strategy.debtToken.symbol}</p>
          </TooltipReference>
          <TokenTooltip strategy={strategy} tooltip={tokenTooltip} />
        </td>
      )}

      <td className={styles.stat}>
        <TooltipReference {...aprTooltip}>
          {/* TODO change this after design decides what new table looks like */}
          <p>0% APR</p>
        </TooltipReference>
        <APRTooltip strategy={strategy} tooltip={aprTooltip} />
      </td>

      <td className={styles.stat}>
        <TooltipReference {...nftCapTooltip}>
          <p>{formatThreeFractionDigits(nftOverCap)}</p>
        </TooltipReference>
        <NFTCapTooltip
          strategy={strategy}
          tooltip={nftCapTooltip}
          nftMarketCap={fakeNFTValue}
          debtTokenMarketCap={debtTokenMarketCap}
        />
      </td>
      <td className={styles.stat}>
        <TooltipReference {...mktCtrTooltip}>
          <p>{formatThreeFractionDigits(markOverNorm)}</p>
        </TooltipReference>
        <MktCtrTooltip
          strategy={strategy}
          tooltip={mktCtrTooltip}
          mark={mark}
          norm={norm}
        />
      </td>
      <td className={styles.rate}>
        <TooltipReference {...rateTooltip}>
          <Health pricesData={pricesData} />
        </TooltipReference>
        <RateTooltip
          strategy={strategy}
          tooltip={rateTooltip}
          pricesData={pricesData}
        />
      </td>
      {includeDetails && (
        <td colSpan={6}>
          <Link href={`/networks/${network}/strategies/${strategy.id}`}>
            <a>Details ↗</a>
          </Link>
        </td>
      )}
    </tr>
  );
}
