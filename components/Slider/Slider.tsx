import ReactSlider from 'react-slider';
import styles from './Slider.module.css';

export type SliderProps = {
  min: number;
  max: number;
  onChange: (value: number, index: number) => void;
  renderThumb: (
    props: any,
    state: { index: number; value: number; valueNow: number },
  ) => JSX.Element | null;
};

export function Slider({ min, max, onChange, renderThumb }: SliderProps) {
  return (
    <ReactSlider
      className={styles.slider}
      trackClassName={styles.track}
      thumbClassName={styles.thumb}
      renderThumb={renderThumb}
      min={min}
      max={max}
      onChange={onChange}
    />
  );
}
