import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import React, { useCallback, useEffect, useState } from 'react';
import strategyStyles from 'components/Strategy/Strategy.module.css';
import styles from './TestPageContent.module.css';
import MintERC20 from '../MintERC20';
import MintCollateral from '../MintCollateral';

type TestPageContentProps = {
  strategyAddress: string;
};

export function TestPageContent({ strategyAddress }: TestPageContentProps) {
  const config = useConfig();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(strategyAddress, config);
    setLendingStrategy(s);
  }, [strategyAddress, config]);

  useEffect(() => {
    populate();
  }, [populate]);

  if (!lendingStrategy) return <></>;

  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.wrapper}>
        <div className={strategyStyles.column}>
          <MintERC20 token={lendingStrategy.underlying} />
          <MintCollateral token={lendingStrategy.collateral} />
        </div>
      </div>
    </div>
  );
}
