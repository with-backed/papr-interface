import { useActivity } from 'hooks/useActivity';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useSwapPositionsData } from 'hooks/useSwapPositionsData';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import styles from './SwapPositionsPageContent.module.css';

export function SwapPositionsPageContent() {
  const { address } = useAccount();
  const price = useLatestMarketPrice();

  const [addressToUse, setAddressToUse] = useState<string | undefined>(address);
  const [timestamps, setTimestamps] = useState<{ start: number; end: number }>({
    start: 0,
    end: 1704067200,
  });

  const handleAddressToUseUpdated = useCallback(
    (address: string) => {
      setAddressToUse(address);
    },
    [setAddressToUse],
  );
  const handleStartTimestampUpdated = useCallback(
    (start: number) => {
      setTimestamps((t) => ({ ...t, start }));
    },
    [setTimestamps],
  );
  const handleEndTimestampUpdated = useCallback(
    (end: number) => {
      setTimestamps((t) => ({ ...t, end }));
    },
    [setTimestamps],
  );

  const { averagePurchased, averageSold, netPapr, exitValue } =
    useSwapPositionsData(addressToUse, timestamps.start, timestamps.end);

  return (
    <>
      <div>
        <label>Address: </label>
        <input
          type="text"
          value={addressToUse}
          onChange={(e) => handleAddressToUseUpdated(e.target.value)}
        />
      </div>
      <br />
      <div>
        <label>start timestamp: </label>
        <input
          type="number"
          value={timestamps.start}
          onChange={(e) =>
            handleStartTimestampUpdated(parseInt(e.target.value))
          }
        />
      </div>
      <div>
        <label>end timestamp: </label>
        <input
          type="number"
          value={timestamps.end}
          onChange={(e) => handleEndTimestampUpdated(parseInt(e.target.value))}
        />
      </div>
      <br />

      <div className={styles.netContent}>
        <div className={`${styles.col1} ${styles.column}`}>
          <div className={styles.blue}>
            <div>papr bought - papr sold: {netPapr.toFixed(4)} papr</div>
          </div>
          <p>*</p>
          <div className={styles.blue}>
            <div>current papr price: {price} ETH</div>
          </div>

          <p>=</p>
          <div className={styles.blue}>
            {exitValue.toFixed(4)} ETH gain/loss to close papr position
          </div>
        </div>
        <div className={`col2 ${styles.column} `}>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />

          <p> - </p>
        </div>
        <div className={`col3 ${styles.column}`}>
          <div>
            <div className={styles.green}>
              {/* <div>
                {' '}
                {amountPurchased.toFixed(4)} papr purchased *{' '}
                {averagePurchasePrice.toFixed(4)} ETH weighted avg. price
              </div> */}
              <div> {averagePurchased.toFixed(4)} ETH spent on papr</div>
            </div>
            <p>-</p>
            <div className={styles.orange}>
              {/* <div>
                {' '}
                {amountSold.toFixed(4)} papr sold *{' '}
                {averageSalePrice.toFixed(4)} ETH weighted avg. price
              </div> */}
              <div>{averageSold.toFixed(4)} ETH gained from papr sales</div>
            </div>
            <p>=</p>
            <div className={styles.pink}>
              <div>
                {(averagePurchased - averageSold).toFixed(4)} net ETH realized
              </div>
            </div>
          </div>
        </div>
        <div className={`col4 ${styles.column} `}>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <p> = </p>
        </div>
        <div className={`col5 ${styles.column} `}>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <div className={styles.yellow}>
            total unrealized gain/loss:{' '}
            {(exitValue - (averagePurchased - averageSold)).toFixed(4)} ETH (
            {(exitValue / (averagePurchased - averageSold) - 1).toFixed(4)} %)
          </div>
        </div>
      </div>
      <br />
      {addressToUse && addressToUse != '' && (
        <ActivityTimeline account={addressToUse} />
      )}
    </>
  );
}

interface VoteRowProps {
  account: string;
}

import { ActivityType } from 'hooks/useActivity/useActivity';

import { getActivityKind } from '../Activity/Activity';

interface ActivityWithRunningBalance extends ActivityType {
  runningPaprDebt?: number;
  runningPaprBalance?: number;
  paprDelta?: number;
  ethDelta?: number;
}

const ActivityTimeline: React.FC<VoteRowProps> = ({ account }) => {
  const {
    data: activityData,
    fetching: activityFetching,
    fetchMore,
    remaining,
  } = useActivity(
    '0x3b29c19ff2fcea0ff98d0ef5b184354d74ea74b0',
    account,
    undefined,
    500,
  );

  const [activities, setActivities] = useState<
    ActivityWithRunningBalance[] | null
  >(null);

  const x = 0;

  useEffect(() => {
    activityData.reverse();
    let runningTotal = 0;
    let runningDebtTotal = 0;
    const a: ActivityWithRunningBalance[] = activityData.map((d) => {
      runningTotal += d.tokenIn
        ? d.tokenIn.symbol == 'paprMEME'
          ? (d.amountIn / 1e18) * -1
          : d.amountOut / 1e18
        : 0;
      runningDebtTotal += d.amountBorrowed ? d.amountBorrowed / 1e18 : 0;
      runningDebtTotal -= d.amountRepaid ? d.amountRepaid / 1e18 : 0;
      const activity: ActivityWithRunningBalance = d;
      activity.runningPaprBalance = runningTotal;
      activity.runningPaprDebt = runningDebtTotal;
      // TODO with Adam's work
      // if (activity.liquidityDelta) {
      //   if (activity.controller.token0IsUnderlying) {
      //   }
      // }
      return d;
    });
    a.reverse();
    setActivities(a);
  }, [activityData]);

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.tr}>
          <th>tx</th>
          <th>action type</th>
          <th>vault</th>
          <th>running total papr debt</th>
          <th>papr held delta</th>
          <th>eth held delta</th>
          <th>running total papr bought minus sold</th>
        </tr>
      </thead>
      <tbody>
        {activities &&
          activities.map((d) => {
            return (
              <tr key={d.id} className={styles.tr}>
                <td className={styles.td}>
                  <a
                    href={`https://etherscan.io/tx/${d.id}`}
                    target="_blank"
                    rel="noreferrer">
                    tx
                  </a>
                </td>
                <td className={styles.td}>{getActivityKind(d)}</td>
                <td className={styles.td}>{d.vault?.token.name}</td>
                <td className={styles.td}>{d.runningPaprDebt}</td>
                <td className={styles.td}>
                  {d.tokenIn
                    ? d.tokenIn.symbol == 'paprMEME'
                      ? `-${d.amountIn / 1e18}`
                      : d.amountOut / 1e18
                    : 0}
                </td>
                <td className={styles.td}>
                  {d.tokenIn
                    ? d.tokenIn.symbol == 'paprMEME'
                      ? d.amountOut / 1e18
                      : `-${d.amountIn / 1e18}`
                    : 0}
                </td>
                <td className={styles.td}>{d.runningPaprBalance}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
};
