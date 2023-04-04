import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import dayjs from 'dayjs';
import { useController } from 'hooks/useController';
import { useVaultDebtAccounting } from 'hooks/useVaultDebtAccounting';
import { formatBigNum, formatPercent } from 'lib/numberFormat';
import { useState } from 'react';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';

import styles from './VaultLoansHistory.module.css';

type VaultLoansHistoryProps = {
  vault: VaultsByOwnerForControllerQuery['vaults']['0'];
};

function humanReadableUnixTime(unixTime: number) {
  return dayjs.unix(unixTime).format('MM/DD/YYYY');
}

export function VaultLoansHistory({ vault }: VaultLoansHistoryProps) {
  const { paprToken } = useController();
  const { loans, repayments, effectives } = useVaultDebtAccounting(vault.id);

  const [showLoanDetails, setShowLoanDetails] = useState<{
    [key: number]: boolean;
  }>({});

  return (
    <Fieldset legend={`${vault.token.symbol} History`}>
      <Table className={styles.historyTable}>
        <thead>
          <tr>
            <th>LOAN</th>
            <th>AMOUNT</th>
            <th>PAPR @ ACTION</th>
            <th>INTEREST</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => {
            const loanRepayments = repayments.filter(
              (r) => r.loanNumber === loan.loanNumber,
            );
            const effectiveAccounting = effectives
              .filter((e) => e.loanNumber === loan.loanNumber)
              .at(0)!;

            return (
              <>
                <tr
                  key={loan.loanNumber}
                  onClick={() =>
                    setShowLoanDetails((prev) => ({
                      ...prev,
                      [loan.loanNumber]: !prev[loan.loanNumber],
                    }))
                  }>
                  <td>{humanReadableUnixTime(loan.loanNumber)}</td>
                  <td>
                    {formatBigNum(loan.amount, paprToken.decimals, 4)} papr
                  </td>
                  <td>{loan.paprPriceOrigination} ETH</td>
                  <td>---</td>
                </tr>
                {showLoanDetails[loan.loanNumber] && (
                  <>
                    {loanRepayments.map((r, i) => {
                      return (
                        <>
                          <tr key={`repayment-${r.loanNumber}-${i}`}>
                            <td>-</td>
                            <td>
                              {formatBigNum(r.amount, paprToken.decimals, 4)}{' '}
                              papr
                            </td>
                            <td>{r.paprPriceAtDecrease} ETH</td>
                            <td>{formatPercent(r.effectiveInterest)}</td>
                          </tr>
                        </>
                      );
                    })}
                    <tr>
                      <td>=</td>
                      <td>
                        {formatBigNum(
                          effectiveAccounting.amountRemaining,
                          paprToken.decimals,
                          4,
                        )}{' '}
                        papr
                      </td>
                      <td>{loan.paprPriceNow} ETH</td>
                      <td>
                        {formatPercent(effectiveAccounting.currentInterest)}
                      </td>
                    </tr>
                  </>
                )}
              </>
            );
          })}
        </tbody>
      </Table>
    </Fieldset>
  );
}
