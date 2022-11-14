import React from 'react';
import { Checkmark } from 'components/Icons/Checkmark';
import styles from './Button.module.css';
import { ButtonSize } from './Button';

interface CompletedButtonProps {
  buttonText: React.ReactNode;
  message?: React.ReactNode;
  success?: boolean;
  id?: string;
  size?: ButtonSize;
}

export function CompletedButton({
  buttonText,
  message,
  success = false,
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
    </div>
  );
}
