import {
  DebtIncreasesByVaultDocument,
  DebtIncreasesByVaultQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useConfig } from 'hooks/useConfig';
import { useQuery } from 'urql';
import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { timestampDaysAgo } from 'lib/duration';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import styles from './Loans.module.css';
import Link from 'next/link';

type VaultRowProps = {
  id: string;
  account: string;
  debt: ethers.BigNumberish;
  decimals: ethers.BigNumberish;
  symbol: string;
  ltv?: number;
  maxLTV: ethers.BigNumber | null;
  controllerId: string;
  expanded?: boolean;
};
export function VaultRow({
  id,
  account,
  debt,
  decimals,
  symbol,
  ltv,
  maxLTV,
  controllerId,
  expanded = true,
}: VaultRowProps) {
  const { tokenName } = useConfig();
  const [{ data }] = useQuery<DebtIncreasesByVaultQuery>({
    query: DebtIncreasesByVaultDocument,
    variables: { vaultId: id },
  });

  const createdTimestamp = useMemo(() => {
    if (!data?.debtIncreasedEvents) {
      return undefined;
    }

    if (data.debtIncreasedEvents.length === 0) {
      return undefined;
    }

    return data.debtIncreasedEvents.reduce((prev, e) =>
      prev.timestamp < e.timestamp ? prev : e,
    ).timestamp;
  }, [data]);

  const formattedDebt = useMemo(() => {
    const debtNum = parseFloat(ethers.utils.formatUnits(debt, decimals));
    return formatTokenAmount(debtNum) + ` ${symbol}`;
  }, [debt, decimals, symbol]);

  return (
    <tr>
      <td>
        <Link
          href={`/tokens/${tokenName}/controllers/${controllerId}/vaults/${id}`}>
          {account.substring(0, 7)}
        </Link>
      </td>
      <td className={styles['right-align']}>{formattedDebt}</td>
      {expanded && (
        <td className={styles['right-align']}>
          {!!createdTimestamp ? timestampDaysAgo(createdTimestamp) : '...'}
        </td>
      )}
      <td className={styles['right-align']}>
        {ltv !== undefined ? formatPercent(ltv) : '...'}
      </td>
      <td className={styles['center-align']}>
        {ltv !== undefined && !!maxLTV ? (
          <VaultHealth ltv={ltv} maxLtv={maxLTV} />
        ) : (
          '...'
        )}
      </td>
    </tr>
  );
}
