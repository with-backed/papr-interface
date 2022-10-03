import { Slider } from 'components/Slider';
import { ethers } from 'ethers';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './OpenVault.module.css';

type VaultDebtSliderProps = {
  strategy: LendingStrategy;
  maxDebt: ethers.BigNumber;
  currentVaultDebt: ethers.BigNumber;
  maxLTV: number | null;
  handleChosenDebtChanged: (val: string) => void;
  isBorrowing: boolean;
  setIsBorrowing: (val: boolean) => void;
};

export function VaultDebtSlider({
  strategy,
  maxDebt,
  currentVaultDebt,
  maxLTV,
  handleChosenDebtChanged,
  isBorrowing,
  setIsBorrowing,
}: VaultDebtSliderProps) {
  const maxDebtNumber = useMemo(() => {
    return parseInt(
      ethers.utils.formatUnits(maxDebt, strategy.debtToken.decimals),
    );
  }, [maxDebt, strategy.debtToken.decimals]);
  const currentVaultDebtNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(currentVaultDebt, strategy.debtToken.decimals),
    );
  }, [currentVaultDebt, strategy.debtToken.decimals]);

  const [controlledSliderValue, setControlledSliderValue] = useState<number>(
    currentVaultDebtNumber,
  );
  const [sliderValues, setSliderValues] = useState<number | number[]>(
    isBorrowing
      ? controlledSliderValue
      : [controlledSliderValue, currentVaultDebtNumber],
  );

  const [indicatorLeftPixels, setIndicatorLeftPixels] = useState<string>('');
  const initIndicatorLeftPixels = useCallback(
    (val: string) => {
      if (!indicatorLeftPixels && val !== '0px') setIndicatorLeftPixels(val);
    },
    [indicatorLeftPixels],
  );

  console.log({ isBorrowing, sliderValues });

  return (
    <div className={styles.sliderWrapper}>
      <Slider
        min={0}
        max={maxDebtNumber}
        onChange={(val: number | number[], _index: number) => {
          let result: number;
          if (typeof val === 'number') {
            result = val;
          } else {
            result = val[0];
          }
          setIsBorrowing(result >= currentVaultDebtNumber);
          setSliderValues(
            result >= currentVaultDebtNumber
              ? result
              : [result, currentVaultDebtNumber],
          );
        }}
        onAfterChange={(val: number | number[], _index: number) => {
          if (typeof val === 'number') {
            handleChosenDebtChanged(val.toString());
          } else {
            handleChosenDebtChanged(val[0].toString());
          }
        }}
        hideTrackStyle={isBorrowing}
        value={sliderValues}
        renderThumb={(props, state) => {
          if (!maxLTV) {
            return null;
          }
          let currentLTV: number;
          if (maxDebt.isZero()) {
            currentLTV = 0;
          } else {
            currentLTV = Math.min(
              (state.valueNow / maxDebtNumber) * maxLTV,
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

          initIndicatorLeftPixels(props.style.left);

          return (
            <>
              {currentVaultDebtNumber !== 0 && (
                <div
                  className={styles.currentIndicator}
                  style={{
                    left: indicatorLeftPixels,
                  }}>
                  <div>
                    <p>
                      Current LTV:{' '}
                      {(
                        (currentVaultDebtNumber / maxDebtNumber) *
                        maxLTV
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                  <div>
                    <p>↓</p>
                  </div>
                </div>
              )}

              <div {...props}>
                <div className={`${styles.sliderLabel} ${pushedClassName}`}>
                  {state.index === 0 && (
                    <>
                      <p>Loan Amount</p>
                      <p>{currentLTV.toFixed(2)}% LTV</p>
                    </>
                  )}
                </div>
              </div>
            </>
          );
        }}
      />
      <p className={styles.sliderLabel}>
        Max Loan {!!maxLTV && maxLTV.toString()}% LTV
      </p>
    </div>
  );
}
