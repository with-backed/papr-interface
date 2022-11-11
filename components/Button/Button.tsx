import React, { ButtonHTMLAttributes, ComponentProps, useMemo } from 'react';
import { DialogDisclosure } from 'reakit/Dialog';
import { Disclosure } from 'reakit/Disclosure';
import styles from './Button.module.css';

export type ButtonKind = 'regular' | 'outline';
export type ButtonTheme = 'papr' | 'hero' | 'meme' | 'white';
export type ButtonSize = 'big' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  theme?: ButtonTheme;
  size?: ButtonSize;
}

export function Button({
  children,
  kind = 'regular',
  theme = 'papr',
  size = 'big',
  ...props
}: ButtonProps) {
  const className = useMemo(
    () => [styles[kind], styles[theme], styles[size]].join(' '),
    [kind, theme, size],
  );
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
