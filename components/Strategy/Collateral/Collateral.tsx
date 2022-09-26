import { Fieldset } from 'components/Fieldset';
import { LendingStrategy } from 'lib/LendingStrategy';
import { Asset } from 'nft-react';
import React, { useMemo } from 'react';
import styles from './Collateral.module.css';

type CollateralProps = {
  lendingStrategy: LendingStrategy;
};

export function Collateral({ lendingStrategy: { vaults } }: CollateralProps) {
  const collateral = useMemo(
    () => vaults?.flatMap((v) => v.collateral),
    [vaults],
  );

  if (!collateral || collateral.length === 0) {
    return (
      <Fieldset legend="🖼 Collateral">
        No collateral associated with this strategy
      </Fieldset>
    );
  }

  return (
    <Fieldset legend="🖼 Collateral">
      {collateral.map(({ id, contractAddress, tokenId }) => {
        <Asset key={id} address={contractAddress} tokenId={tokenId} />;
      })}
    </Fieldset>
  );
}
