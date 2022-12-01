import { ButtonTheme } from 'components/Button/Button';
import React from 'react';
import { Button } from 'reakit/Button';
import { Checkbox } from 'reakit/Checkbox';
import styles from './Toggle.module.css';

type ToggleProps = {
  checked: boolean;
  onChange: () => void;
  leftText: string;
  rightText: string;
  theme: ButtonTheme;
};

export function Toggle({
  checked,
  leftText,
  rightText,
  onChange,
  theme,
}: ToggleProps) {
  return (
    <Checkbox
      as={Button}
      checked={checked}
      onChange={onChange}
      className={styles.toggle}>
      <div className={[styles.container, styles[theme]].join(' ')}>
        <div>{leftText}</div>
        <div>{rightText}</div>
      </div>
    </Checkbox>
  );
}
