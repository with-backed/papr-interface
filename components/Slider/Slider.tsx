import { Fieldset } from 'components/Fieldset';
import { useState } from 'react';
import ReactSlider from 'react-slider';
import styles from './Slider.module.css';

const squares = 'slider-squares';
const dots = 'slider-dots';
const dense = 'slider-dots-dense';

export function Slider() {
  const [style, setStyle] = useState(squares);
  return (
    <>
      <Fieldset legend="Slider Style" style={{ width: '498px' }}>
        <label>
          Squares{' '}
          <input
            type="radio"
            checked={style === squares}
            onChange={() => setStyle(squares)}
          />
        </label>
        <br />
        <label>
          Dots{' '}
          <input
            type="radio"
            checked={style === dots}
            onChange={() => setStyle(dots)}
          />
        </label>
        <br />
        <label>
          Dense Dots{' '}
          <input
            type="radio"
            checked={style === dense}
            onChange={() => setStyle(dense)}
          />
        </label>
      </Fieldset>
      <ReactSlider
        className={styles[style]}
        trackClassName={styles.track}
        thumbClassName={styles.thumb}
      />
    </>
  );
}
