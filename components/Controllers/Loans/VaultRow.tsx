import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLTV } from 'hooks/useLTV';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { SubgraphVault } from 'types/SubgraphVault';

type VaultRowProps = {
  account: string;
  vault: SubgraphVault;
};
export function VaultRow({ account, vault }: VaultRowProps) {
  const { paprToken } = useController();
  const debt = useMemo(() => {
    return ethers.BigNumber.from(vault.debt);
  }, [vault]);
  const formattedDebt = useMemo(() => {
    const debt = parseFloat(
      ethers.utils.formatUnits(vault.debt, paprToken.decimals),
    );
    return `${formatTokenAmount(debt)}`;
  }, [paprToken.decimals, vault]);

  const ltv = useLTV(
    vault?.token.id,
    vault?.collateralCount,
    ethers.BigNumber.from(debt),
  );
  const { tokenName } = useConfig();
  const formattedLTV = useMemo(
    () => (ltv === null ? '...' : formatPercent(ltv)),
    [ltv],
  );

  return (
    <tr>
      <td>
        <Link href={`/tokens/${tokenName}/vaults/${vault.id}`} legacyBehavior>
          {account.substring(0, 7)}
        </Link>
      </td>
      <td>{formattedDebt}</td>
      <td>{formattedLTV}</td>
      <td>
        <VaultHealth vault={vault} />
      </td>
    </tr>
  );
}
