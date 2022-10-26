import React from 'react';
import { LendingStrategy } from 'lib/LendingStrategy';
import { LoanDetails } from 'components/Strategies/Loans/LoanDetails';
import strategyStyles from '../Strategy.module.css';
import { Collateral } from 'components/Strategies/Collateral';
import { Activity } from 'components/Strategies/Activity';
import { TokenPerformance } from 'components/Strategies/TokenPerformance';
import { StrategyPricesData } from 'lib/strategies/charts';

type VaultPageContentProps = {
  lendingStrategy: LendingStrategy;
  vaultId: string;
  pricesData: StrategyPricesData | null;
};

export function VaultPageContent({
  lendingStrategy,
  vaultId,
  pricesData,
}: VaultPageContentProps) {
  return (
    <div className={strategyStyles.wrapper}>
      <LoanDetails vaultId={vaultId} lendingStrategy={lendingStrategy} />
      <Collateral lendingStrategy={lendingStrategy} vaultId={vaultId} />
      <Activity lendingStrategy={lendingStrategy} vaultId={vaultId} />
      <TokenPerformance
        pricesData={{ [lendingStrategy.id]: pricesData }}
        strategies={[lendingStrategy]}
      />
    </div>
  );
}
