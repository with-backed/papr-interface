import { ethers } from 'ethers';
import { useActivity } from 'hooks/useActivity';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useLPActivityAndImplicitSwaps } from 'hooks/useLPActivityAndImplicitSwaps';
import { useSwapPositionsData } from 'hooks/useSwapPositionsData';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { getActivityKind } from '../Activity/Activity';
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

      {/*  */}
      <div className={styles.pnlSummary}>
        <div className={styles.column}>
          <span className={styles.blue}>
            papr bought - papr sold: {netPapr.toFixed(4)} papr
          </span>
          <span>*</span>
          <span className={styles.blue}>current papr price: {price} ETH</span>
          <span>=</span>
          <span className={styles.blue}>
            {exitValue.toFixed(4)} ETH gain/loss to close papr position
          </span>
        </div>
        <div className={styles.bottomMath}>
          <span>-</span>
        </div>
        <div className={styles.column}>
          <span className={styles.green}>
            {averagePurchased.toFixed(4)} ETH spent on papr
          </span>
          <span>-</span>
          <span className={styles.red}>
            {averageSold.toFixed(4)} ETH gained from papr sales
          </span>
          <span>=</span>
          <span className={styles.pink}>
            {(averagePurchased - averageSold).toFixed(4)} net ETH realized
          </span>
        </div>
        <div className={styles.bottomMath}>
          <span>=</span>
        </div>
        <div className={styles.bottomMath}>
          <span className={styles.yellow}>
            total unrealized gain/loss:{' '}
            {(exitValue - (averagePurchased - averageSold)).toFixed(4)} ETH (
            {(exitValue / (averagePurchased - averageSold) - 1).toFixed(4)} %)
          </span>
        </div>
      </div>

      <br />
      <p className={styles.diffExplainer}>
        {' '}
        The below &rdquo;running total papr bought minus sold&rdquo; might
        differ from &rdquo;papr bought - papr sold&rdquo; shown above because
        above we model as if you exited all LP positions this moment. Accounting
        will also be slightly broken if the EOA has used paprMEME individually
        and as a signer on a multisig.
      </p>
      {addressToUse && addressToUse != '' && (
        <ActivityTimeline
          account={addressToUse}
          startTime={timestamps.start}
          endTime={timestamps.end}
        />
      )}
    </>
  );
}

interface ActivityTimelineProps {
  account: string;
  startTime: number;
  endTime: number;
}

interface ActivityWithRunningBalance extends ActivityType {
  runningPaprDebt?: number;
  runningPaprBalance?: number;
  paprDelta?: number;
  ethDelta?: number;
  kind?: string;
}

const ActivityTimeline = ({
  account,
  startTime,
  endTime,
}: ActivityTimelineProps) => {
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

  const { implicitSwaps } = useLPActivityAndImplicitSwaps(
    account,
    startTime,
    endTime,
  );

  const [activities, setActivities] = useState<
    ActivityWithRunningBalance[] | null
  >(null);

  useEffect(() => {
    const filteredActivities = activityData
      .filter((a) => a.timestamp >= startTime && a.timestamp <= endTime)
      .reverse();
    let runningTotal = 0;
    let runningDebtTotal = 0;
    const activitiesWithBalances: ActivityWithRunningBalance[] =
      filteredActivities
        .map((activity) => {
          runningTotal += activity.tokenIn
            ? activity.tokenIn.symbol == 'paprMEME'
              ? (activity.amountIn / 1e18) * -1
              : activity.amountOut / 1e18
            : 0;
          runningDebtTotal += activity.amountBorrowed
            ? activity.amountBorrowed / 1e18
            : 0;
          runningDebtTotal -= activity.amountRepaid
            ? activity.amountRepaid / 1e18
            : 0;
          const activityWithRunningBalance: ActivityWithRunningBalance =
            activity;
          activityWithRunningBalance.runningPaprBalance = runningTotal;
          activityWithRunningBalance.runningPaprDebt = runningDebtTotal;
          activityWithRunningBalance.kind = getActivityKind(activity);
          if (activity.liquidityDelta) {
            const id = activity.id;
            const implied = implicitSwaps.filter((s) => s.id == id);
            if (implied.length > 0) {
              const s = implied[0];
              activityWithRunningBalance.amountIn = s.amountIn;
              activityWithRunningBalance.amountOut = s.amountOut;
              activityWithRunningBalance.tokenIn = s.tokenIn;
              activityWithRunningBalance.tokenOut = s.tokenOut;
              runningTotal += s.tokenIn
                ? s.tokenIn.symbol == 'paprMEME'
                  ? (s.amountIn / 1e18) * -1
                  : s.amountOut / 1e18
                : 0;
            }
            activityWithRunningBalance.runningPaprBalance = runningTotal;
          }
          return activityWithRunningBalance;
        })
        .reverse();
    setActivities(activitiesWithBalances);
  }, [activityData, startTime, endTime, account, implicitSwaps]);

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.tr}>
          <th>Date</th>
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
          activities.map((activity) => {
            return (
              <tr key={activity.id} className={styles.tr}>
                <td className={styles.td}>
                  <a
                    href={`https://etherscan.io/tx/${activity.id}`}
                    target="_blank"
                    rel="noreferrer">
                    {new Date(activity.timestamp * 1000).toLocaleDateString()}
                  </a>
                </td>
                <td className={styles.td}>{activity.kind}</td>
                <td className={styles.td}>{activity.vault?.token.name}</td>
                <td className={styles.td}>{activity.runningPaprDebt}</td>
                <td className={styles.td}>
                  {activity.tokenIn
                    ? activity.tokenIn.symbol.includes('papr')
                      ? (activity.amountIn / 1e18) * -1
                      : activity.amountOut / 1e18
                    : 0}
                </td>
                <td className={styles.td}>
                  {activity.tokenIn
                    ? activity.tokenIn.symbol.includes('papr')
                      ? ethers.utils.formatUnits(
                          activity.amountOut,
                          activity.tokenOut?.decimals,
                        )
                      : '-' +
                        ethers.utils.formatUnits(
                          activity.amountIn,
                          activity.tokenIn?.decimals,
                        )
                    : 0}
                </td>
                <td className={styles.td}>{activity.runningPaprBalance}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
};
