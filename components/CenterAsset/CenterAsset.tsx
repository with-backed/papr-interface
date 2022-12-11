import { Asset } from '@center-inc/react';
import React, { ComponentProps } from 'react';

import styles from './CenterAsset.module.css';

type CenterAssetProps = Exclude<
  ComponentProps<typeof Asset>,
  'renderLoading' | 'renderError'
>;

export function CenterAsset(props: CenterAssetProps) {
  return <Asset {...props} renderError={Error} renderLoading={Loading} />;
}

function Loading() {
  return <div className={styles.loading}></div>;
}

function Error() {
  return <div className={styles.error}></div>;
}
