import Link from 'next/link';
import { ComponentProps, useMemo } from 'react';

import styles from './Button.module.css';

interface GradientButtonLinkProps extends ComponentProps<typeof Link> {
  color: 'blue' | 'orange';
  newTab?: boolean;
}

export function GradientButtonLink({
  children,
  color,
  newTab,
  ...props
}: GradientButtonLinkProps) {
  const className = useMemo(() => styles[`gradient-button-${color}`], [color]);
  return (
    <Link
      className={className}
      target={newTab ? '_blank' : undefined}
      {...props}>
      {children}
    </Link>
  );
}
