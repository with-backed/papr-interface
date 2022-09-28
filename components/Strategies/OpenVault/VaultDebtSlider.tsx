import { Slider } from 'components/Slider';
import { ethers } from 'ethers';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useMemo } from 'react';
import styles from './OpenVault.module.css';

type VaultDebtSliderProps = {
  strategy: LendingStrategy;
  maxDebt: number;
  currentDebtTaken: number;
  debtForSelectedLTV: number;
  maxLTV: number | null;
  handleDebtAmountChanged: (val: string) => void;
};

export function VaultDebtSlider({
  strategy,
  maxDebt,
  currentDebtTaken,
  debtForSelectedLTV,
  maxLTV,
  handleDebtAmountChanged,
}: VaultDebtSliderProps) {
  const repaymentAmount = useMemo(() => {
    return (currentDebtTaken - debtForSelectedLTV).toString();
  }, [currentDebtTaken, debtForSelectedLTV]);

  const {
    quoteForSwap: quoteForRepayment,
    priceImpact,
    tokenOut,
  } = useQuoteWithSlippage(strategy, repaymentAmount, false);

  if (maxDebt === 0) return <></>;

  return (
    <div className={styles.sliderWrapper}>
      <Slider
        min={0}
        max={maxDebt}
        onChange={(val: number[], index: number) =>
          index === 0
            ? handleDebtAmountChanged(val[0].toString())
            : console.log({ val })
        }
        ariaLabel={['left thumb', 'right thumb']}
        defaultValue={[0, currentDebtTaken]}
        renderThumb={(props, state) => {
          if (!maxLTV) {
            return null;
          }
          let currentLTV: number;
          if (maxDebt == 0) {
            currentLTV = 0;
          } else {
            currentLTV = Math.min(
              (state.valueNow / parseFloat(maxDebt.toString())) * maxLTV,
              maxLTV,
            );
          }

          let pushedClassName: string;
          if (currentLTV < 5) {
            pushedClassName = styles.sliderLabelPushedRight;
          } else if (currentLTV > maxLTV - 5) {
            pushedClassName = styles.sliderLabelPushedLeft;
          } else {
            pushedClassName = '';
          }

          return (
            <div {...props}>
              <div className={`${styles.sliderLabel} ${pushedClassName}`}>
                {state.index === 0 && (
                  <>
                    <p>Loan Amount</p>
                    <p>{currentLTV.toFixed(2)}% LTV</p>
                  </>
                )}
                {state.index === 1 && (
                  <>
                    <p>Repayment</p>
                    <p>${quoteForRepayment}</p>
                  </>
                )}
              </div>
            </div>
          );
        }}
      />
      <p className={styles.sliderLabel}>
        Max Loan {!!maxLTV && maxLTV.toString()}% LTV
      </p>
    </div>
  );
}
