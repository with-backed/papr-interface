import ReactSlider from 'react-slider';
import styles from './Slider.module.css';

export function Slider() {
  return (
    <ReactSlider
      className={styles.slider}
      trackClassName={styles.track}
      thumbClassName={styles.thumb}
    />
  );
}
