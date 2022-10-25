import React from 'react';
import { LendingStrategy } from 'lib/LendingStrategy';
import { LoanDetails } from 'components/Strategies/Loans/LoanDetails';
import strategyStyles from '../Strategy.module.css';

type VaultPageContentProps = {
  lendingStrategy: LendingStrategy;
  vaultId: string;
};

export function VaultPageContent({
  lendingStrategy,
  vaultId,
}: VaultPageContentProps) {
  return (
    <div className={strategyStyles.wrapper}>
      <LoanDetails vaultId={vaultId} lendingStrategy={lendingStrategy} />
    </div>
  );
}
