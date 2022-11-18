import { Slider } from 'components/Slider';
import { ethers } from 'ethers';
import { PaprController } from 'lib/PaprController';
import { formatPercent } from 'lib/numberFormat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './OpenVault.module.css';

type VaultDebtSliderProps = {
  controller: PaprController;
  maxDebtNumber: number;
  currentVaultDebtNumber: number;
  maxLTV: number | null;
  controlledSliderValue: number;
  setControlledSliderValue: (val: number) => void;
  handleChosenDebtChanged: (val: string) => void;
  setIsBorrowing: (val: boolean) => void;
};

export function VaultDebtSlider({
  controller,
  maxDebtNumber,
  currentVaultDebtNumber,
  maxLTV,
  controlledSliderValue,
  setControlledSliderValue,
  handleChosenDebtChanged,
  setIsBorrowing,
}: VaultDebtSliderProps) {
  // When NFTs are added/removed, set the slider to equal 50% of the max LTV.
  useEffect(() => {
    if (maxDebtNumber > 0 && currentVaultDebtNumber === 0) {
      const defaultDebt = maxDebtNumber / 2;
      setControlledSliderValue(defaultDebt);
      handleChosenDebtChanged(defaultDebt.toString());
    }
  }, [
    handleChosenDebtChanged,
    maxDebtNumber,
    currentVaultDebtNumber,
    setControlledSliderValue,
  ]);

  const [indicatorLeftPixels, setIndicatorLeftPixels] = useState<string>('');
  const initIndicatorLeftPixels = useCallback(
    (val: string) => {
      if (!indicatorLeftPixels && val !== '0px') setIndicatorLeftPixels(val);
    },
    [indicatorLeftPixels],
  );
  const [blackTrackWidth, setBlackTrackWidth] = useState<[string, number]>([
    '',
    maxDebtNumber,
  ]);

  const initBlackTrackWidth = useCallback(
    (val: string) => {
      if (!blackTrackWidth[0] && val !== '0px')
        setBlackTrackWidth([val, maxDebtNumber]);
    },
    [blackTrackWidth, maxDebtNumber],
  );

  useEffect(() => {
    if (maxDebtNumber !== blackTrackWidth[1]) {
      const newBlackTrackPosition =
        Math.min(1, currentVaultDebtNumber / maxDebtNumber) * 100 * 5.7;
      setBlackTrackWidth([`${newBlackTrackPosition}px`, maxDebtNumber]);
    }
  }, [maxDebtNumber, blackTrackWidth, currentVaultDebtNumber]);

  return (
    <div>
      <p className={styles.totalLTVLabel}>
        Max: {!!maxLTV && formatPercent(maxLTV)} LTV
      </p>
      <Slider
        min={0}
        max={maxDebtNumber}
        onChange={(val: number, _index: number) => {
          setControlledSliderValue(val);
          setIsBorrowing(val >= currentVaultDebtNumber);
        }}
        onAfterChange={(val: number, _index: number) => {
          if (typeof val === 'number') {
            handleChosenDebtChanged(val.toString());
          }
        }}
        value={controlledSliderValue}
        renderThumb={(props, state) => {
          if (!maxLTV) {
            return null;
          }
          let currentLTV: number;
          if (maxDebtNumber === 0) {
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
              <div {...props}>
                <div className={`${styles.sliderLabel} ${pushedClassName}`}>
                  <p>{formatPercent(currentLTV)} LTV</p>
                </div>
              </div>
            </>
          );
        }}
        renderTrack={(props, _state) => {
          initBlackTrackWidth(`${props.style.left}px`);
          return <div {...props}></div>;
        }}
        blackTrackWidth={blackTrackWidth[0]}
        hideBlackTrack={currentVaultDebtNumber === 0}
      />
    </div>
  );
}
