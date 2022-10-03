import ReactSlider from 'react-slider';
import styles from './Slider.module.css';

export type SliderProps = {
  min: number;
  max: number;
  onChange: (value: number | number[], index: number) => void;
  renderThumb: (
    props: any,
    state: { index: number; value: number | number[]; valueNow: number },
  ) => JSX.Element | null;
  value: number | number[] | undefined;
  hideTrackStyle: boolean;
};

export function Slider({
  min,
  max,
  onChange,
  renderThumb,
  value,
  hideTrackStyle = false,
}: SliderProps) {
  return (
    <>
      {!hideTrackStyle && (
        <style>
          {`.${styles.track}-1 {
          background-image: url('/slider-tile-black.svg') !important;
          left: 0 !important;
        }`}
          {`.${styles.thumb}-1 {
          display: none;
        }`}
        </style>
      )}

      <ReactSlider
        className={styles.slider}
        trackClassName={styles.track}
        thumbClassName={styles.thumb}
        renderThumb={renderThumb}
        min={min}
        max={max}
        pearling
        onChange={onChange}
        value={value}
      />
    </>
  );
}
