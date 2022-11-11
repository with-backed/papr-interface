import React, { ComponentProps } from 'react';
import Link from 'next/link';
import { ButtonKind, ButtonSize, ButtonTheme } from './Button';
import styles from './Button.module.css';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  kind?: ButtonKind;
  theme?: ButtonTheme;
  size?: ButtonSize;
}

export function ButtonLink({
  children,
  kind = 'regular',
  theme = 'papr',
  size = 'big',
  ...props
}: ButtonLinkProps) {
  const className = [
    styles[kind],
    styles['button-link'],
    styles[theme],
    styles[size],
  ].join(' ');
  return (
    <Link {...props}>
      <a className={className}>{children}</a>
    </Link>
  );
}
