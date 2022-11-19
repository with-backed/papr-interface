import React from 'react';
import { Button } from 'reakit/Button';
import { Checkbox } from 'reakit/Checkbox';
import styles from './Toggle.module.css';

type ToggleProps = {
  checked: boolean;
  onChange: () => void;
  leftText: string;
  rightText: string;
  hideLeftText?: boolean;
  hideRightText?: boolean;
};

export function Toggle({
  checked,
  leftText,
  rightText,
  onChange,
  hideLeftText = false,
  hideRightText = false,
}: ToggleProps) {
  return (
    <Checkbox
      as={Button}
      checked={checked}
      onChange={onChange}
      className={styles.toggle}>
      <div className={styles.container}>
        {!hideLeftText && <div>{leftText}</div>}
        {!hideRightText && <div>{rightText}</div>}
      </div>
    </Checkbox>
  );
}
