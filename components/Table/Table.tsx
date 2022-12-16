import { useTheme } from 'hooks/useTheme';
import React, { TableHTMLAttributes, useMemo } from 'react';

import styles from './Table.module.css';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  fixed?: boolean;
}

export function Table({ children, className, fixed, ...props }: TableProps) {
  const theme = useTheme();
  const baseClassName = useMemo(
    () => (fixed ? styles['table-fixed'] : styles.table),
    [fixed],
  );
  const fullClassName = useMemo(
    () =>
      className
        ? [baseClassName, styles[theme], className].join(' ')
        : [baseClassName, styles[theme]].join(' '),
    [baseClassName, theme, className],
  );
  return <table className={fullClassName}>{children}</table>;
}
