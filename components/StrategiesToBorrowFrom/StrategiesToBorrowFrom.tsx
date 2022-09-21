import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy } from 'lib/strategies';
import { StrategyPricesData } from 'lib/strategies/charts';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { Tooltip, TooltipReference, useTooltipState } from 'reakit';

import styles from './strategiesToBorrowFrom.module.css';
import {
  APRTooltip,
  MktCtrTooltip,
  NFTCapTooltip,
  RateTooltip,
  TokenTooltip,
} from './Tooltips';

const percentDiff = (a: number, b: number): number =>
  Math.abs(((b - a) / a) * 100);

const diffToPosition = (diff: number, index: number, val: number) => {
  if (val <= index) {
    if (diff < 5) {
      return 0;
    } else if (diff < 10) {
      return 1;
    } else if (diff < 15) {
      return 2;
    } else {
      return 3;
    }
  } else {
    if (diff < 5) {
      return 5;
    } else if (diff < 10) {
      return 6;
    } else if (diff < 15) {
      return 7;
    } else {
      return 8;
    }
  }
};

export type StrategiesToBorrowFromProps = {
  strategies: LendingStrategy[];
  pricesData: { [key: string]: StrategyPricesData };
  includeDetails: boolean;
  legend: string;
};

export default function StrategiesToBorrowFrom({
  strategies,
  pricesData,
  includeDetails,
  legend,
}: StrategiesToBorrowFromProps) {
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
          ? strategy.token1.contract.totalSupply()
          : strategy.token0.contract.totalSupply(),
      ),
    );
    for (let i = 0; i < totalSupplies.length; i++) {
      setDebtTokenSupplies((prev) => ({
        ...prev,
        [strategies[i].contract.address]: totalSupplies[i],
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
            {strategies.map((strategy, i) => {
              const pricesDataForStrategy =
                pricesData[strategy.contract.address];
              const index = pricesDataForStrategy.index;
              const targetYearlyGrowth = pricesDataForStrategy.indexDPR * 365;

              const mark = parseFloat(
                pricesDataForStrategy.markValues[
                  pricesDataForStrategy.markValues.length - 1
                ],
              );
              const norm = parseFloat(
                pricesDataForStrategy.normalizationValues[
                  pricesDataForStrategy.normalizationValues.length - 1
                ],
              );
              const markOverNorm = mark / norm;

              const indexVersusMark = percentDiff(index, mark);
              const indexVersusNorm = percentDiff(index, norm);

              let markPosition = diffToPosition(indexVersusMark, index, mark);
              let normPosition = diffToPosition(indexVersusNorm, index, norm);

              if (markPosition === normPosition) {
                markPosition++;
              }

              const fakeNFTValue = 300000;
              const debtTokenMarketCap =
                parseFloat(
                  ethers.utils.formatEther(
                    debtTokenSupplies[strategy.contract.address],
                  ),
                ) * mark;

              const nftOverCap = fakeNFTValue / debtTokenMarketCap;

              return (
                <tr
                  onClick={() =>
                    router.push(
                      `/network/goerli/strategy/${strategy.contract.address}/borrow`,
                    )
                  }
                  className={`${i % 2 === 0 ? styles.even : ''} ${
                    styles.clickable
                  }`}
                  key={strategy.contract.address}>
                  {!includeDetails && (
                    <td className={styles.tokenName}>
                      <TooltipReference {...tokenTooltip}>
                        <p>
                          $papr{strategy.underlying.symbol}_
                          {strategy.collateral.symbol}
                          {strategy.maxLTVPercent}
                        </p>
                      </TooltipReference>
                      <TokenTooltip
                        strategy={strategy}
                        tooltip={tokenTooltip}
                      />
                    </td>
                  )}

                  <td className={styles.stat}>
                    <TooltipReference {...aprTooltip}>
                      <p>{targetYearlyGrowth.toFixed(0)}% APR</p>
                    </TooltipReference>
                    <APRTooltip strategy={strategy} tooltip={aprTooltip} />
                  </td>

                  <td className={styles.stat}>
                    <TooltipReference {...nftCapTooltip}>
                      <p>{nftOverCap.toFixed(2)}</p>
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
                      <p>{markOverNorm.toFixed(2)}</p>
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
                      {['-', '-', '-', '-', '|', '-', '-', '-', '-'].map(
                        (char, i) => (
                          <>
                            {markPosition === i && <>R</>}
                            {normPosition === i && <>C</>}
                            {markPosition !== i && normPosition !== i && (
                              <>{char}</>
                            )}
                          </>
                        ),
                      )}
                    </TooltipReference>
                    <RateTooltip
                      strategy={strategy}
                      tooltip={rateTooltip}
                      pricesData={pricesDataForStrategy}
                    />
                  </td>
                  {includeDetails && (
                    <td colSpan={6}>
                      <Link
                        href={`/network/${config.network}/strategy/${strategy.contract.address}`}>
                        <a>Details ↗</a>
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Fieldset>
  );
}
