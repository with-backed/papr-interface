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
      <table className={styles.table}>
        <thead>
          <tr className={styles['header-row']}>
            <th aria-hidden></th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody className={styles.body}>
          {collateral.map(({ id, contractAddress, tokenId }) => (
            <Row key={id} contractAddress={contractAddress} tokenId={tokenId} />
          ))}
        </tbody>
      </table>
      <div className={styles.wrapper}></div>
    </Fieldset>
  );
}

type RowProps = {
  contractAddress: string;
  tokenId: string;
};

function Row({ contractAddress, tokenId }: RowProps) {
  return (
    <tr className={styles.row}>
      <td aria-hidden className={styles['thumbnail-container']}>
        <div className={styles.thumbnail}>
          <Asset address={contractAddress} tokenId={tokenId} preset="small" />
        </div>
      </td>
      <td className={styles['token-id']}>
        <span>#{tokenId}</span>
      </td>
    </tr>
  );
}
