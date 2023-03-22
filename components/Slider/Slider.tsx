import { ButtonTheme } from 'components/Button/Button';
import { pirsch } from 'lib/pirsch';
import { useCallback, useMemo } from 'react';
import ReactSlider from 'react-slider';

import styles from './Slider.module.css';

/**
 * When creating a loan we want to highlight the risk of pushing LTV
 * too high. We have decided that 45% is the point to highlight, which
 * is 90% of the slider's range.
 */
const DANGER_THRESHOLD = 0.9;

export type SliderProps = {
  min: number;
  max: number;
  onChange?: (value: number, index: number) => void;
  onAfterChange?: (value: number, index: number) => void;
  renderThumb: (
    props: any,
    state: { index: number; value: number; valueNow: number },
  ) => JSX.Element | null;
  value: number | undefined;
  renderTrack: (
    props: any,
    state: { index: number; value: number },
  ) => JSX.Element | null;
  blackTrackWidth: string;
  hideBlackTrack: boolean;
  theme: ButtonTheme;
};

export function Slider({
  min,
  max,
  onChange,
  onAfterChange,
  renderThumb,
  renderTrack,
  value,
  blackTrackWidth,
  hideBlackTrack,
  theme,
}: SliderProps) {
  const step = useMemo(() => {
    const divisibleSteps = (max - min) / 100;
    if (divisibleSteps < 1) return divisibleSteps;
    return 1;
  }, [max, min]);

  const handleAfterChange: typeof onAfterChange = useCallback(
    (value, index) => {
      pirsch('Slider dragged', {});
      if (onAfterChange) {
        onAfterChange(value, index);
      }
    },
    [onAfterChange],
  );

  const isRisky = useMemo(() => {
    return value ? value / max >= DANGER_THRESHOLD : false;
  }, [max, value]);

  const trackClassName = useMemo(() => {
    const base = [styles.track, styles[theme]];
    if (isRisky) {
      return [...base, styles.danger].join(' ');
    }
    return base.join(' ');
  }, [isRisky, theme]);

  const thumbClassName = useMemo(() => {
    const base = [styles.thumb, styles[theme]];
    if (isRisky) {
      return [...base, styles.danger].join(' ');
    }
    return base.join(' ');
  }, [isRisky, theme]);

  return (
    <>
      <div
        style={{
          width: hideBlackTrack ? '0px' : blackTrackWidth,
          left: '0px',
          position: 'relative',
          top: '36px',
          height: '36px',
          backgroundImage: "url('/slider-tile-black.svg')",
          zIndex: 1,
        }}></div>
      <ReactSlider
        className={[styles.slider, styles[theme]].join(' ')}
        trackClassName={trackClassName}
        thumbClassName={thumbClassName}
        renderThumb={renderThumb}
        renderTrack={renderTrack}
        min={min}
        max={max}
        step={step}
        pearling
        onChange={onChange}
        onAfterChange={handleAfterChange}
        value={value}
      />
    </>
  );
}
