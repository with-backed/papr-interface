import { Slider } from 'components/Slider';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useEffect, useMemo } from 'react';
import styles from './OpenVault.module.css';

type VaultDebtSliderProps = {
  strategy: LendingStrategy;
  maxDebt: number;
  currentVaultDebt: number;
  chosenDebt: number;
  maxLTV: number | null;
  handleChosenDebtChanged: (val: string) => void;
};

export function VaultDebtSlider({
  strategy,
  maxDebt,
  currentVaultDebt,
  chosenDebt,
  maxLTV,
  handleChosenDebtChanged,
}: VaultDebtSliderProps) {
  if (maxDebt === 0) return <></>;

  return (
    <div className={styles.sliderWrapper}>
      <Slider
        min={0}
        max={maxDebt}
        onChange={(val: number[], index: number) => {
          handleChosenDebtChanged(val.toString());
        }}
        ariaLabel={['left thumb']}
        defaultValue={[currentVaultDebt]}
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
                {state.index === 1 && state.value[0] != state.value[1] && (
                  <>
                    <p>Repayment</p>
                    <p>${}</p>
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
