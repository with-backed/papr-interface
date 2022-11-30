import { useConfig } from 'hooks/useConfig';
import React from 'react';
import { ethers } from 'ethers';
import { formatPercent } from 'lib/numberFormat';
import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import Link from 'next/link';

type VaultRowProps = {
  id: string;
  account: string;
  debt: string;
  ltv?: number;
  maxLTV: ethers.BigNumber | null;
  controllerId: string;
};
export function VaultRow({
  id,
  account,
  debt,
  ltv,
  maxLTV,
  controllerId,
}: VaultRowProps) {
  const { tokenName } = useConfig();

  return (
    <tr>
      <td>
        <Link href={`/tokens/${tokenName}/vaults/${id}`}>
          {account.substring(0, 7)}
        </Link>
      </td>
      <td>{debt}</td>
      <td>{ltv !== undefined ? formatPercent(ltv) : '...'}</td>
      <td>
        {ltv !== undefined && !!maxLTV ? (
          <VaultHealth ltv={ltv} maxLtv={maxLTV} />
        ) : (
          '...'
        )}
      </td>
    </tr>
  );
}
