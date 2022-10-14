import React, { useMemo } from 'react';
import { LendingStrategy } from 'lib/LendingStrategy';
import styles from './YourPositions.module.css';
import { useCurrentVault } from 'hooks/useCurrentVault/useCurrentVault';
import { useAccount, useContractRead } from 'wagmi';
import { Fieldset } from 'components/Fieldset';
import { formatTokenAmount, formatPercent } from 'lib/numberFormat';
import { computeLtv, convertOneScaledValue } from 'lib/strategies';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { erc20ABI } from 'wagmi';

const LEGEND = '🩰 Your Positions';

type YourPositionsProps = {
  lendingStrategy: LendingStrategy;
  latestMarketPrice?: number;
};
export function YourPositions({
  lendingStrategy,
  latestMarketPrice,
}: YourPositionsProps) {
  //const { address } = useAccount();
  const address = '0x1813dc5442317e229445109ed8e72e5de4991e17';

  const { data: paprMEMEBalance, isFetching: balanceFetching } =
    useContractRead({
      addressOrName: lendingStrategy.debtToken.id,
      contractInterface: erc20ABI,
      functionName: 'balanceOf',
      args: [address],
    });

  const { currentVault, vaultFetching } = useCurrentVault(
    lendingStrategy,
    address,
  );

  if (vaultFetching || balanceFetching) {
    return <Fieldset legend={LEGEND}>Loading...</Fieldset>;
  }

  return (
    <Fieldset legend={LEGEND}>
      {!!paprMEMEBalance && (
        <BalanceInfo
          paprMEMEBalance={ethers.BigNumber.from(paprMEMEBalance)}
          paprMEMEDecimals={lendingStrategy.debtToken.decimals}
          paprMEMESymbol={lendingStrategy.debtToken.symbol}
          latestMarketPrice={latestMarketPrice}
        />
      )}
      {!!currentVault && (
        <LoanInfo lendingStrategy={lendingStrategy} vault={currentVault} />
      )}
    </Fieldset>
  );
}

type LoanInfoProps = {
  lendingStrategy: LendingStrategy;
  vault: NonNullable<ReturnType<typeof useCurrentVault>['currentVault']>;
};
function LoanInfo({ lendingStrategy, vault }: LoanInfoProps) {
  const norm = useAsyncValue(
    () => lendingStrategy.newNorm(),
    [lendingStrategy],
  );
  const maxLTV = useAsyncValue(
    () => lendingStrategy.maxLTV(),
    [lendingStrategy],
  );
  const formattedLTV = useMemo(() => {
    if (!norm) {
      return '... LTV';
    }
    return (
      formatPercent(
        convertOneScaledValue(
          computeLtv(vault.debt, vault.totalCollateralValue, norm),
          4,
        ),
      ) + ' LTV'
    );
  }, [norm, vault]);
  const formattedDebt = useMemo(() => {
    return (
      formatTokenAmount(
        convertOneScaledValue(ethers.BigNumber.from(vault.debt), 4),
      ) + ' USDC'
    );
  }, [vault]);
  const formattedMaxLTV = useMemo(() => {
    if (!maxLTV) {
      return '...';
    }
    return formatPercent(convertOneScaledValue(maxLTV, 4));
  }, [maxLTV]);
  return (
    <p>
      Your loan of <b>{formattedDebt}</b> is at <b>{formattedLTV}</b> and is
      projected to reach the {formattedMaxLTV} max in <b>777 days</b>.
    </p>
  );
}

type BalanceInfoProps = {
  paprMEMEBalance: ethers.BigNumber;
  paprMEMEDecimals: number;
  paprMEMESymbol: string;
  latestMarketPrice?: number;
};
function BalanceInfo({
  paprMEMEBalance,
  paprMEMEDecimals,
  paprMEMESymbol,
  latestMarketPrice,
}: BalanceInfoProps) {
  const formattedBalance = useMemo(() => {
    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(paprMEMEBalance, paprMEMEDecimals),
    );
    return formatTokenAmount(convertedBalance) + ` ${paprMEMESymbol}`;
  }, [paprMEMEBalance, paprMEMEDecimals, paprMEMESymbol]);
  const formattedValue = useMemo(() => {
    if (!latestMarketPrice) {
      return 'an unknown amount of USDC (no market data available)';
    }

    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(paprMEMEBalance, paprMEMEDecimals),
    );
    return formatTokenAmount(convertedBalance * latestMarketPrice) + ' USDC';
  }, [paprMEMEBalance, paprMEMEDecimals, latestMarketPrice]);
  return (
    <p>
      You hold <b>{formattedBalance}</b> worth <b>{formattedValue}</b>.
    </p>
  );
}
