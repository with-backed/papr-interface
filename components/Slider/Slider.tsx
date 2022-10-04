import ReactSlider from 'react-slider';
import styles from './Slider.module.css';

export type SliderProps = {
  min: number;
  max: number;
  onChange: (value: number, index: number) => void;
  onAfterChange: (value: number, index: number) => void;
  renderThumb: (
    props: any,
    state: { index: number; value: number; valueNow: number },
  ) => JSX.Element | null;
  value: number | undefined;
  renderTrack: (
    props: any,
    state: { index: number; value: number },
  ) => JSX.Element | null;
  blackTrackStyles: any;
};

export function Slider({
  min,
  max,
  onChange,
  onAfterChange,
  renderThumb,
  renderTrack,
  value,
  blackTrackStyles,
}: SliderProps) {
  return (
    <>
      <div
        style={{
          ...blackTrackStyles,
          height: '36px',
          backgroundImage: "url('/slider-tile-black.svg')",
          zIndex: 1,
        }}></div>
      <ReactSlider
        className={styles.slider}
        trackClassName={styles.track}
        thumbClassName={styles.thumb}
        renderThumb={renderThumb}
        renderTrack={renderTrack}
        min={min}
        max={max}
        pearling
        onChange={onChange}
        onAfterChange={onAfterChange}
        value={value}
      />
    </>
  );
}
