import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { DisplayAddress } from 'components/DisplayAddress';
import { NFTMarquee } from 'components/NFTMarquee';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { formatTokenAmount } from 'lib/numberFormat';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
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
  const marketPrice = useLatestMarketPrice();

  const debtTooltip = useTooltipState();

  const { tokenName } = useConfig();

  return (
    <tr>
      <td className={styles['marquee-column']}>
        <NFTMarquee collateral={vault.collateral} />
      </td>
      <td>
        <Link href={`/tokens/${tokenName}/vaults/${vault.id}`}>
          <DisplayAddress address={account} />
        </Link>
      </td>
      <td>
        <TooltipReference {...debtTooltip}>{formattedDebt}</TooltipReference>
        <Tooltip {...debtTooltip}>
          {!!marketPrice && (
            <span>
              {formatTokenAmount(marketPrice * parseFloat(formattedDebt))} ETH
            </span>
          )}
          {!marketPrice && '...'}
        </Tooltip>
      </td>
      <td>
        <VaultHealth vault={vault} />
      </td>
    </tr>
  );
}
