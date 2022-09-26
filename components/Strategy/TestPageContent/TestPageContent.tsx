import React, { useMemo } from 'react';
import strategyStyles from 'components/Strategy/Strategy.module.css';
import styles from './TestPageContent.module.css';
import MintERC20 from './MintERC20';
import MintCollateral from './MintCollateral';
import { LendingStrategy } from 'lib/LendingStrategy';
import { erc721Contract } from 'lib/contracts';
import { useSigner } from 'wagmi';

type TestPageContentProps = {
  lendingStrategy: LendingStrategy;
};

export function TestPageContent({ lendingStrategy }: TestPageContentProps) {
  const { data: signer } = useSigner();
  const collateral = useMemo(
    () => erc721Contract(lendingStrategy.collateralAddress, signer!),
    [lendingStrategy, signer],
  );
  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.wrapper}>
        <div className={strategyStyles.column}>
          <MintERC20 token={lendingStrategy.underlying} />
<<<<<<< HEAD
          <MintCollateral token={collateral} />
=======
          <MintCollateral token={lendingStrategy.allowedCollateral} />
>>>>>>> ff85274 (more progress)
        </div>
      </div>
    </div>
  );
}
