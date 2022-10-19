import React, { useMemo } from 'react';
import strategyStyles from 'components/Strategies/Strategy.module.css';
import styles from './TestPageContent.module.css';
import MintERC20 from './MintERC20';
import MintCollateral from './MintCollateral';
import { LendingStrategy } from 'lib/LendingStrategy';
import { erc721Contract } from 'lib/contracts';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';

type TestPageContentProps = {
  lendingStrategy: LendingStrategy;
};

export function TestPageContent({ lendingStrategy }: TestPageContentProps) {
  const signerOrProvider = useSignerOrProvider();
  const collateral = useMemo(
    () =>
      lendingStrategy.allowedCollateral.map((ac) =>
        erc721Contract(ac.contractAddress, signerOrProvider),
      ),
    [lendingStrategy.allowedCollateral, signerOrProvider],
  );
  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.wrapper}>
        <div className={strategyStyles.column}>
          <MintERC20 token={lendingStrategy.underlying} />
          {collateral.map((c) => (
            <MintCollateral token={c} key={c.address} />
          ))}
        </div>
      </div>
    </div>
  );
}
