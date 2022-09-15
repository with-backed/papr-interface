import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { LendingStrategy } from 'lib/strategies';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import styles from './strategiesToBorrowFrom.module.css';

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
};

export default function StrategiesToBorrowFrom({
  strategies,
  pricesData,
}: StrategiesToBorrowFromProps) {
  const router = useRouter();
  const [debtTokenSupplies, setDebtTokenSupplies] = useState<{
    [key: string]: ethers.BigNumber;
  }>({});
  const [debtTokenSuppliesLoading, setDebtTokenSuppliesLoading] =
    useState<boolean>(true);

  const initDebtTokenMarketCap = useCallback(async () => {
    for (let i = 0; i < strategies.length; i++) {
      const strategyDebtTokenMarketCap = await strategies[
        i
      ].underlying.contract.totalSupply();
      setDebtTokenSupplies((prev) => ({
        ...prev,
        [strategies[i].contract.address]: strategyDebtTokenMarketCap,
      }));
    }
    setDebtTokenSuppliesLoading(false);
  }, [strategies]);

  useEffect(() => {
    initDebtTokenMarketCap();
  }, [strategies]);

  if (debtTokenSuppliesLoading) return <></>;

  return (
    <Fieldset legend="🎮 strategies">
      <div className={styles.strategies}>
        <ol>
          <li className={`${styles.row} ${styles.columnLabels}`}>
            <div className={styles.token}>
              <p>Token</p>
            </div>
            <div className={styles.mathColumn}>
              <div>
                <p>target</p>
              </div>
            </div>
            <div className={styles.mathColumn}>
              <div>
                <p>NFT/CAP</p>
              </div>
            </div>
            <div className={styles.mathColumn}>
              <div>
                <p>MKT/CTR</p>
              </div>
            </div>
            <div className={styles.rate}>
              <div>
                <p>Rate</p>
              </div>
            </div>
          </li>
          {strategies.map((strategy, i) => {
            const pricesDataForStrategy = pricesData[strategy.contract.address];
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
              <li
                className={`${styles.row} ${i % 2 === 0 ? styles.even : ''} ${
                  styles.clickable
                }`}
                onClick={() =>
                  router.push(
                    `/network/goerli/in-kind/strategies/${strategy.contract.address}/borrow`,
                  )
                }
                key={strategy.contract.address}>
                <div className={styles.token}>
                  <p>
                    $papr{strategy.underlying.symbol}_
                    {strategy.collateral.symbol}
                    {strategy.maxLTVPercent}
                  </p>
                </div>
                <div className={styles.mathColumn}>
                  <p>{targetYearlyGrowth.toFixed(0)}% APR</p>
                </div>
                <div className={styles.mathColumn}>
                  <p>{nftOverCap.toFixed(2)}</p>
                </div>
                <div className={styles.mathColumn}>
                  <p>{markOverNorm.toFixed(2)}</p>
                </div>
                <div className={styles.rate}>
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
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Fieldset>
  );
}
