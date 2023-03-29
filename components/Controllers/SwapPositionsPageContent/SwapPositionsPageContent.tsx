import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useSwapPositionsData } from 'hooks/useSwapPositionsData';
import { useCallback, useState } from 'react';
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
    </>
  );
}
