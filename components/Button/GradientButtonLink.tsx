import Link from 'next/link';
import { ComponentProps, useMemo } from 'react';

import styles from './Button.module.css';

interface GradientButtonLinkProps extends ComponentProps<typeof Link> {
  color: 'blue' | 'orange';
}

export function GradientButtonLink({
  children,
  color,
  ...props
}: GradientButtonLinkProps) {
  const className = useMemo(() => styles[`gradient-button-${color}`], [color]);
  return (
    <Link className={className} {...props}>
      {children}
    </Link>
  );
}
