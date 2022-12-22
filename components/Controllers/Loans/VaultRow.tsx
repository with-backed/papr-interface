import { useConfig } from 'hooks/useConfig';
import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import Link from 'next/link';
import { useLTV } from 'hooks/useLTVs';
import { PaprController } from 'lib/PaprController';

type VaultRowProps = {
  paprController: PaprController;
  id: string;
  account: string;
  maxLTV: ethers.BigNumber | null;
};
export function VaultRow({
  id,
  account,
  paprController,
  maxLTV,
}: VaultRowProps) {
  const thisVault = useMemo(
    () => paprController.vaults?.find((v) => v.id === id),
    [id, paprController],
  );
  const debt = useMemo(() => {
    if (!thisVault) {
      return ethers.BigNumber.from(0);
    }
    return ethers.BigNumber.from(thisVault.debt);
  }, [thisVault]);
  const formattedDebt = useMemo(() => {
    const debt = parseFloat(
      ethers.utils.formatUnits(
        thisVault?.debt,
        paprController.debtToken.decimals,
      ),
    );
    return `$ ${formatTokenAmount(debt)}`;
  }, [paprController.debtToken.decimals, thisVault]);

  const { ltv } = useLTV(
    paprController,
    thisVault?.token.id,
    thisVault?.collateralCount,
    ethers.BigNumber.from(debt),
    maxLTV,
  );
  const { tokenName } = useConfig();
  const formattedLTV = useMemo(
    () => (ltv === null ? '...' : formatPercent(ltv)),
    [ltv],
  );

  return (
    <tr>
      <td>
        <Link href={`/tokens/${tokenName}/vaults/${id}`} legacyBehavior>
          {account.substring(0, 7)}
        </Link>
      </td>
      <td>{formattedDebt}</td>
      <td>{formattedLTV}</td>
      <td>
        {ltv !== null && !!maxLTV ? (
          <VaultHealth ltv={ltv} maxLtv={maxLTV} />
        ) : (
          '...'
        )}
      </td>
    </tr>
  );
}
