import React, { ButtonHTMLAttributes, useMemo } from 'react';

import styles from './Button.module.css';

export type ButtonKind =
  | 'regular'
  | 'outline'
  | 'outline-transparent'
  | 'white';
export type ButtonTheme = 'papr' | 'hero' | 'meme' | 'trash';
export type ButtonSize = 'big' | 'small' | 'xsmall';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  theme?: ButtonTheme;
  size?: ButtonSize;
  additionalClassNames?: string[];
}

export function Button({
  children,
  kind = 'regular',
  theme = 'papr',
  size = 'big',
  additionalClassNames = [],
  ...props
}: ButtonProps) {
  const className = useMemo(
    () =>
      [
        styles[kind],
        styles[theme],
        styles[size],
        ...additionalClassNames.map((cn) => styles[cn]),
      ].join(' '),
    [kind, theme, size, additionalClassNames],
  );
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
