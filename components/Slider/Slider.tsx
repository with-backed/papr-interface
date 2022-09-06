import ReactSlider from 'react-slider';
import styles from './Slider.module.css';

export type SliderProps = {
  min: number;
  max: number;
  onChange: (value: number, index: number) => void;
};

export function Slider({ min, max, onChange }: SliderProps) {
  return (
    <ReactSlider
      className={styles.slider}
      trackClassName={styles.track}
      thumbClassName={styles.thumb}
      min={min}
      max={max}
      onChange={onChange}
    />
  );
}
