import React, { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.css';

export type ButtonKind =
  | 'neutral'
  | 'clickable'
  | 'visited'
  | 'active'
  | 'alert'
  | 'success';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  onClick?: () => void;
}

export function TextButton({
  children,
  kind = 'neutral',
  className,
  ...props
}: ButtonProps) {
  const appliedClassname = `${styles[`text-button-${kind}`]} ${className}`;
  return (
    <button className={appliedClassname} {...props}>
      {children}
    </button>
  );
}
