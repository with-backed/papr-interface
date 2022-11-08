import React, { TableHTMLAttributes, useMemo } from 'react';
import styles from './Table.module.css';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  fixed?: boolean;
}

export function Table({ children, className, fixed, ...props }: TableProps) {
  const baseClassName = useMemo(
    () => (fixed ? styles['table-fixed'] : styles.table),
    [fixed],
  );
  const fullClassName = useMemo(
    () => (className ? [baseClassName, className].join(' ') : baseClassName),
    [baseClassName, className],
  );
  return <table className={fullClassName}>{children}</table>;
}
