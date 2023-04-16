import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { usePoolTokens } from 'hooks/usePoolTokens';
import { price } from 'lib/controllers/charts/mark';
import { percentChange } from 'lib/tokenPerformance';
import { useMemo } from 'react';
import {
  DebtActivityByVaultDocument,
  DebtActivityByVaultQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export type DebtIncreaseAccounting = {
  loanNumber: number;
  amount: ethers.BigNumber;
  paprPriceOrigination: number;
  paprPriceNow: number;
  interest: ethers.BigNumber;
};

export type DebtDecreaseAccounting = {
  loanNumber: number;
  amount: ethers.BigNumber;
  paprPriceAtDecrease: number;
  effectiveInterest: number;
};

export type EffectiveLoanAccounting = {
  loanNumber: number;
  amountRemaining: ethers.BigNumber;
  currentInterest: number;
};

export function useVaultDebtAccounting(vaultId: string) {
  const { token0IsUnderlying } = useController();
  const paprPrice = useLatestMarketPrice();
  const { token0, token1 } = usePoolTokens();

  const [{ data: debtActivityForVaultData }] =
    useQuery<DebtActivityByVaultQuery>({
      query: DebtActivityByVaultDocument,
      variables: {
        vaultId,
      },
      pause: !vaultId,
    });

  const debtActivity = useMemo(() => {
    if (!debtActivityForVaultData) return [];
    return debtActivityForVaultData.activities;
  }, [debtActivityForVaultData]);

  const loans: DebtIncreaseAccounting[] = useMemo(() => {
    if (!paprPrice) return [];
    return debtActivity
      .filter((da) => !!da.amountBorrowed)
      .map((da) => {
        return {
          loanNumber: da.timestamp,
          amount: ethers.BigNumber.from(da.amountBorrowed!),
          paprPriceOrigination: parseFloat(
            price(
              ethers.BigNumber.from(da.sqrtPricePool!),
              token0IsUnderlying ? token1 : token0,
              token0IsUnderlying ? token0 : token1,
              token0,
            ).toFixed(4),
          ),
          paprPriceNow: paprPrice,
          interest: ethers.BigNumber.from(0),
        };
      });
  }, [debtActivity, paprPrice, token0, token0IsUnderlying, token1]);

  const repayments: DebtDecreaseAccounting[] = useMemo(() => {
    const repaymentActivities = debtActivity.filter((da) => !!da.amountRepaid);

    let startIndex = 0;
    let partialRepayment = ethers.BigNumber.from(0);
    return loans
      .map((l) => {
        const { debtDecreaseAccountings, indexStopped, partialRepaymentUsed } =
          createRepaymentEntriesForLoan(
            l,
            repaymentActivities.slice(startIndex).map((ra, i) => {
              if (i === 0) {
                return {
                  ...ra,
                  amountRepaid: ethers.BigNumber.from(ra.amountRepaid!).sub(
                    partialRepayment,
                  ),
                };
              } else {
                return ra;
              }
            }),
            token0IsUnderlying,
            token0,
            token1,
          );
        partialRepayment = partialRepaymentUsed;
        startIndex = indexStopped;
        return debtDecreaseAccountings;
      })
      .flat();
  }, [debtActivity, loans, token0, token0IsUnderlying, token1]);

  const effectives: EffectiveLoanAccounting[] = useMemo(() => {
    return loans.map((l) => {
      const repaymentsForLoan = repayments.filter(
        (r) => r.loanNumber === l.loanNumber,
      );
      const amountRepaid = repaymentsForLoan.reduce(
        (acc, r) => acc.add(r.amount),
        ethers.BigNumber.from(0),
      );
      const amountRemaining = l.amount.sub(amountRepaid);
      const currentInterest = percentChange(
        l.paprPriceOrigination,
        l.paprPriceNow,
      );
      return {
        loanNumber: l.loanNumber,
        amountRemaining,
        currentInterest,
      };
    });
  }, [repayments, loans]);

  return { loans, repayments, effectives };
}

function createRepaymentEntriesForLoan(
  loan: DebtIncreaseAccounting,
  repaymentActivities: ActivityType[],
  token0IsUnderlying: boolean,
  token0: Token,
  token1: Token,
) {
  let debtDecreaseAccountings: DebtDecreaseAccounting[] = [];

  let currentRepaid = ethers.BigNumber.from(0);
  let repaymentIndex = 0;
  let partialRepaymentUsed = ethers.BigNumber.from(0);

  while (
    currentRepaid.lt(loan.amount) &&
    repaymentIndex <= repaymentActivities.length - 1
  ) {
    let repaid = ethers.BigNumber.from(
      repaymentActivities[repaymentIndex].amountRepaid!,
    );
    if (currentRepaid.add(repaid).gt(loan.amount)) {
      repaid = loan.amount.sub(currentRepaid);
      partialRepaymentUsed = loan.amount.sub(currentRepaid);
    }

    const priceAtRepayment = parseFloat(
      price(
        ethers.BigNumber.from(
          repaymentActivities[repaymentIndex].sqrtPricePool!,
        ),
        token0IsUnderlying ? token1 : token0,
        token0IsUnderlying ? token0 : token1,
        token0,
      ).toFixed(4),
    );
    const debtDecrease: DebtDecreaseAccounting = {
      loanNumber: loan.loanNumber,
      amount: repaid,
      paprPriceAtDecrease: priceAtRepayment,
      effectiveInterest: percentChange(
        loan.paprPriceOrigination,
        priceAtRepayment,
      ),
    };
    debtDecreaseAccountings = [...debtDecreaseAccountings, debtDecrease];

    currentRepaid = currentRepaid.add(repaid);
    repaymentIndex++;
  }
  return {
    debtDecreaseAccountings,
    indexStopped: partialRepaymentUsed.eq(ethers.BigNumber.from(0))
      ? repaymentIndex
      : repaymentIndex - 1,
    partialRepaymentUsed,
  };
}
