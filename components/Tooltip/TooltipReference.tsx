import { ComponentProps } from 'preact/compat';
import React from 'react';
import { TooltipReference as ReakitTooltipReference } from 'reakit';

import styles from './Tooltip.module.css';

type TooltipReferenceProps = ComponentProps<typeof ReakitTooltipReference>;
export function TooltipReference({
  children,
  ...props
}: TooltipReferenceProps) {
  return (
    <ReakitTooltipReference className={styles.reference} as="span" {...props}>
      {children}
    </ReakitTooltipReference>
  );
}
