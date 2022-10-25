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
import { VaultHealth } from 'components/Strategies/Loans/VaultHealth';
import styles from './Loans.module.css';
import Link from 'next/link';

type VaultRowProps = {
  id: string;
  debt: ethers.BigNumberish;
  decimals: ethers.BigNumberish;
  symbol: string;
  ltv?: number;
  maxLTV: ethers.BigNumber | null;
  strategyId: string;
  expanded?: boolean;
};
export function VaultRow({
  id,
  debt,
  decimals,
  symbol,
  ltv,
  maxLTV,
  strategyId,
  expanded = true,
}: VaultRowProps) {
  const { network } = useConfig();
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
    <tr className={styles.row}>
      <td>
        <Link
          href={`/networks/${network}/strategies/${strategyId}/vaults/${id}`}>
          {id.substring(0, 7)}
        </Link>
      </td>
      <td className={styles['right-align']}>{formattedDebt}</td>
      {expanded && (
        <td className={styles['right-align']}>
          {!!createdTimestamp ? timestampDaysAgo(createdTimestamp) : '...'}
        </td>
      )}
      <td className={styles['right-align']}>
        {ltv ? formatPercent(ltv) : '...'}
      </td>
      <td className={styles['center-align']}>
        {!!ltv && !!maxLTV ? <VaultHealth ltv={ltv} maxLtv={maxLTV} /> : '...'}
      </td>
    </tr>
  );
}
