import React, { TableHTMLAttributes, useMemo } from 'react';
import styles from './Table.module.css';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {}

export function Table({ children, className, ...props }: TableProps) {
  const fullClassName = useMemo(
    () => (className ? [styles.table, className].join(' ') : styles.table),
    [className],
  );
  return <table className={fullClassName}>{children}</table>;
}
