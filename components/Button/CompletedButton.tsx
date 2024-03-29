import { Checkmark } from 'components/Icons/Checkmark';
import { X } from 'components/Icons/X';
import React from 'react';

import { ButtonSize } from './Button';
import styles from './Button.module.css';

interface CompletedButtonProps {
  buttonText: React.ReactNode;
  message?: React.ReactNode;
  success?: boolean;
  failure?: boolean;
  id?: string;
  size?: ButtonSize;
}

export function CompletedButton({
  buttonText,
  message,
  success = false,
  failure = false,
  size = 'big',
  id,
}: CompletedButtonProps) {
  const className = [
    styles['button-completed'],
    styles.secondary,
    styles[size],
  ].join(' ');
  return (
    <div id={id} className={className}>
      {buttonText}
      {!!message && (
        <div className={styles['button-completed-message']}>{message}</div>
      )}
      {success && (
        <div aria-hidden className={styles['button-completed-icon']}>
          <Checkmark />
        </div>
      )}
      {failure && (
        <div
          aria-hidden
          className={`${styles['button-completed-icon']} ${styles['failure']}`}>
          <X />
        </div>
      )}
    </div>
  );
}
