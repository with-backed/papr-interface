import React, { useMemo } from 'react';
import { LendingStrategy } from 'lib/LendingStrategy';
import styles from './YourPositions.module.css';
import { useCurrentVault } from 'hooks/useCurrentVault/useCurrentVault';
import { useAccount, useContractRead } from 'wagmi';
import { Fieldset } from 'components/Fieldset';
import { formatTokenAmount, formatPercent } from 'lib/numberFormat';
import {
  computeLiquidationEstimation,
  computeLtv,
  convertOneScaledValue,
} from 'lib/strategies';
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
  const { address } = useAccount();
  const { data: rawPaprMEMEBalance, isFetching: balanceFetching } =
    useContractRead({
      address: lendingStrategy.debtToken.id,
      abi: erc20ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

  const paprMemeBalance = useMemo(
    () => ethers.BigNumber.from(rawPaprMEMEBalance || 0),
    [rawPaprMEMEBalance],
  );

  const { currentVault, vaultFetching } = useCurrentVault(
    lendingStrategy,
    address,
  );

  if (!address) {
    return (
      <Fieldset legend={LEGEND}>
        Connect your wallet to see your positions.
      </Fieldset>
    );
  }

  if (vaultFetching || balanceFetching) {
    return <Fieldset legend={LEGEND}>Loading...</Fieldset>;
  }

  return (
    <Fieldset legend={LEGEND}>
      {!paprMemeBalance.eq(0) && (
        <BalanceInfo
          paprMEMEBalance={paprMemeBalance}
          paprMEMEDecimals={lendingStrategy.debtToken.decimals}
          paprMEMESymbol={lendingStrategy.debtToken.symbol}
          latestMarketPrice={latestMarketPrice}
        />
      )}
      {!!currentVault && (
        <LoanInfo lendingStrategy={lendingStrategy} vault={currentVault} />
      )}
      {paprMemeBalance.eq(0) && !currentVault && (
        <p>You do not have any positions on this strategy.</p>
      )}
    </Fieldset>
  );
}

type LoanInfoProps = {
  lendingStrategy: LendingStrategy;
  vault: NonNullable<ReturnType<typeof useCurrentVault>['currentVault']>;
};
function LoanInfo({ lendingStrategy, vault }: LoanInfoProps) {
  const { address } = useAccount();
  const liquidationEstimate = useAsyncValue(async () => {
    if (!address || !vault) {
      return null;
    }
    const maxDebt = await lendingStrategy.maxDebt(address);
    const debtBigNumber = ethers.BigNumber.from(vault.debt);
    return computeLiquidationEstimation(
      debtBigNumber,
      maxDebt,
      lendingStrategy,
    );
  }, [address, lendingStrategy, vault]);
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
      projected to reach the {formattedMaxLTV} max in{' '}
      <b>{liquidationEstimate} days</b>.
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
