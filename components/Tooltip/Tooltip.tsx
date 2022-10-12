import React from 'react';
import { Tooltip as ReakitTooltip } from 'reakit';
import { ComponentProps } from 'preact/compat';
import styles from './Tooltip.module.css';

type TooltipProps = ComponentProps<typeof ReakitTooltip>;
export function Tooltip({ children, ...props }: TooltipProps) {
  return (
    <ReakitTooltip {...props}>
      <div className={styles.tooltip}>{children}</div>
    </ReakitTooltip>
  );
}
