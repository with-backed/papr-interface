import React, { ComponentProps } from 'react';
import Link from 'next/link';
import { ButtonKind, ButtonTheme } from './Button';
import styles from './Button.module.css';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  kind: ButtonKind;
  theme: ButtonTheme;
}

export function ButtonLink({
  children,
  kind,
  theme,
  ...props
}: ButtonLinkProps) {
  const className = [styles[kind], styles['button-link'], styles[theme]].join(
    ' ',
  );
  return (
    <Link {...props}>
      <a className={className}>{children}</a>
    </Link>
  );
}
