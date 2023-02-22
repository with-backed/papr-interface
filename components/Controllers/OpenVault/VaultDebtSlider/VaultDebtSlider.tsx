import useResizeObserver from '@react-hook/resize-observer';
import { Slider } from 'components/Slider';
import { useTheme } from 'hooks/useTheme';
import { formatPercent } from 'lib/numberFormat';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from '../VaultDebtPicker/VaultDebtPicker.module.css';

type VaultDebtSliderProps = {
  maxDebtNumber: number;
  currentVaultDebtNumber: number;
  maxLTV: number | null;
  controlledSliderValue: number;
  setControlledSliderValue: (val: number) => void;
  handleChosenDebtChanged: (val: string) => void;
  setIsBorrowing: (val: boolean) => void;
  setHideLoanFormToggle: (val: boolean) => void;
};

export function VaultDebtSlider({
  maxDebtNumber,
  currentVaultDebtNumber,
  maxLTV,
  controlledSliderValue,
  setControlledSliderValue,
  handleChosenDebtChanged,
  setIsBorrowing,
  setHideLoanFormToggle,
}: VaultDebtSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [hideMaxLTV, setHideMaxLTV] = useState<boolean>(false);
  const [blackTrackWidth, setBlackTrackWidth] = useState<[string, number]>([
    '',
    maxDebtNumber,
  ]);
  const [defaultInitialized, setDefaultInitialized] = useState<boolean>(false);

  const initBlackTrackWidth = useCallback(
    (val: string) => {
      if (!blackTrackWidth[0] && val !== '0px')
        setBlackTrackWidth([val, maxDebtNumber]);
    },
    [blackTrackWidth, maxDebtNumber],
  );

  useEffect(() => {
    if (
      maxDebtNumber > 0 &&
      currentVaultDebtNumber === 0 &&
      !defaultInitialized
    ) {
      setControlledSliderValue(maxDebtNumber / 2);
      handleChosenDebtChanged((maxDebtNumber / 2).toString());
      setDefaultInitialized(true);
    }
  }, [
    maxDebtNumber,
    currentVaultDebtNumber,
    handleChosenDebtChanged,
    setControlledSliderValue,
    defaultInitialized,
  ]);

  const resizeBlackTrack = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    const width = containerRef.current.clientWidth;
    const ratio = Math.min(1, currentVaultDebtNumber / maxDebtNumber);
    const newTrackWidth = Math.floor(ratio * width);
    const newPositionPixels = `${newTrackWidth}px`;
    if (
      newPositionPixels !== blackTrackWidth[0] ||
      maxDebtNumber !== blackTrackWidth[1]
    ) {
      setBlackTrackWidth([newPositionPixels, maxDebtNumber]);
    }
  }, [blackTrackWidth, currentVaultDebtNumber, maxDebtNumber]);

  useEffect(() => {
    resizeBlackTrack();
  }, [resizeBlackTrack]);

  useResizeObserver(
    (containerRef.current || null) as HTMLElement | null,
    resizeBlackTrack,
  );

  return (
    <div className={styles['slider-wrapper']} ref={containerRef}>
      <p
        className={`${styles.totalLTVLabel} ${
          hideMaxLTV ? styles.hidden : ''
        }`}>
        Max: {!!maxLTV && formatPercent(maxLTV)} LTV
      </p>
      <Slider
        min={0}
        max={maxDebtNumber}
        onChange={(val: number, _index: number) => {
          setHideLoanFormToggle(false);
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
            if (currentLTV >= 0.38) {
              setHideMaxLTV(true);
            } else {
              setHideMaxLTV(false);
            }
          }

          return (
            <>
              <div {...props}>
                <div className={styles.sliderLabel}>
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
        theme={theme}
      />
    </div>
  );
}
