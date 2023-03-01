import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { NFTMarquee } from 'components/NFTMarquee';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLTV } from 'hooks/useLTV';
import { formatTokenAmount } from 'lib/numberFormat';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { SubgraphVault } from 'types/SubgraphVault';

import styles from './Loans.module.css';

type VaultRowProps = {
  account: string;
  vault: SubgraphVault;
};
export function VaultRow({ account, vault }: VaultRowProps) {
  const { paprToken } = useController();
  const formattedDebt = useMemo(() => {
    const debt = parseFloat(
      ethers.utils.formatUnits(vault.debt, paprToken.decimals),
    );
    return `${formatTokenAmount(debt)}`;
  }, [paprToken.decimals, vault]);

  const { tokenName } = useConfig();

  return (
    <tr>
      <td className={styles['marquee-column']}>
        <NFTMarquee collateral={vault.collateral} />
      </td>
      <td>
        <Link href={`/tokens/${tokenName}/vaults/${vault.id}`} legacyBehavior>
          {account.substring(0, 7)}
        </Link>
      </td>
      <td>{formattedDebt}</td>
      <td>
        <VaultHealth vault={vault} />
      </td>
    </tr>
  );
}
