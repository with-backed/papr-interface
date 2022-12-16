import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { formatPercent } from 'lib/numberFormat';
import Link from 'next/link';
import React from 'react';

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
        <Link href={`/tokens/${tokenName}/vaults/${id}`} legacyBehavior>
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
