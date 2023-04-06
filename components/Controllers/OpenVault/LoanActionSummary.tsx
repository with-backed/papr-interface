import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useTheme } from 'hooks/useTheme';
import { formatBigNum, formatPercent } from 'lib/numberFormat';
import { useMemo } from 'react';

import styles from './VaultDebtPicker.module.css';

type LoanActionSummaryProps = {
  isBorrowing: boolean;
  usingPerpetual: boolean;
  debtToBorrowOrRepay: ethers.BigNumber;
  quote: ethers.BigNumber | null;
  fee: ethers.BigNumber | null;
  slippage: number | null;
  projectedAPR: number | null;
  setUsingPerpetual: (val: boolean) => void;
  errorMessage: string;
};

export function LoanActionSummary({
  isBorrowing,
  usingPerpetual,
  debtToBorrowOrRepay,
  quote,
  fee,
  slippage,
  projectedAPR,
  setUsingPerpetual,
  errorMessage,
}: LoanActionSummaryProps) {
  const controller = useController();
  const theme = useTheme();

  const quoteWithFee = useMemo(() => {
    if (!quote || !fee) return null;
    if (isBorrowing) return quote.sub(fee);
    else return quote.add(fee);
  }, [quote, fee, isBorrowing]);

  return (
    <div className={styles.loanActionSummaryWrapper}>
      <div className={[styles.loanActionSummary, styles[theme]].join(' ')}>
        <div>
          <div>
            <p>
              {isBorrowing ? 'Borrow' : 'Repay'} {controller.paprToken.symbol}
            </p>
          </div>
          <div>
            <p>
              {formatBigNum(debtToBorrowOrRepay, controller.paprToken.decimals)}
            </p>
          </div>
        </div>
        <div>
          <div className={styles.swapQuote}>
            <input
              type="checkbox"
              onChange={() => setUsingPerpetual(!usingPerpetual)}
            />
            {isBorrowing && <p>Swap for {controller.underlying.symbol}</p>}
            {!isBorrowing && <p>Swap from {controller.underlying.symbol}</p>}
          </div>
          <div>
            {quote && (
              <p
                className={`${
                  usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
                }`}>
                {formatBigNum(quote, controller.underlying.decimals)}
              </p>
            )}
            {!quote && <p>...</p>}
          </div>
        </div>
        <div
          className={`${
            usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
          }`}>
          <div>
            <p>Slippage</p>
          </div>
          <div>
            {slippage !== null && <p>{slippage.toFixed(2)}%</p>}
            {slippage === null && <p>...</p>}
          </div>
        </div>
        <div
          className={`${
            usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
          }`}>
          <div>
            <p>papr.wtf swap fee (0.3%)</p>
          </div>
          <div>
            {fee && <p>{formatBigNum(fee, controller.underlying.decimals)}</p>}
            {!fee && <p>-</p>}
          </div>
        </div>
        <div
          className={`${
            usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
          }`}>
          <div>
            <p>Projected Contract Rate</p>
          </div>
          <div>
            {projectedAPR && <p>{formatPercent(projectedAPR)}</p>}
            {!projectedAPR && <p>-</p>}
          </div>
        </div>
        <div>
          <div>
            <p>
              {isBorrowing ? 'Receive' : 'Pay'}{' '}
              {usingPerpetual
                ? controller.paprToken.symbol
                : controller.underlying.symbol}
            </p>
          </div>
          <div>
            {usingPerpetual
              ? formatBigNum(debtToBorrowOrRepay, controller.paprToken.decimals)
              : quoteWithFee &&
                formatBigNum(quoteWithFee, controller.underlying.decimals)}
          </div>
        </div>
        {!!errorMessage && (
          <div className={styles.error}>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
