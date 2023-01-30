import Link from 'next/link';
import React, { ComponentProps } from 'react';

import { ButtonKind, ButtonSize, ButtonTheme } from './Button';
import styles from './Button.module.css';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  kind?: ButtonKind;
  theme?: ButtonTheme;
  size?: ButtonSize;
  newTab?: boolean;
}

export function ButtonLink({
  children,
  kind = 'regular',
  theme = 'papr',
  size = 'big',
  newTab = false,
  ...props
}: ButtonLinkProps) {
  const className = [
    styles[kind],
    styles['button-link'],
    styles[theme],
    styles[size],
  ].join(' ');
  return (
    <Link
      {...props}
      className={className}
      target={newTab ? '_blank' : undefined}>
      {children}
    </Link>
  );
}
