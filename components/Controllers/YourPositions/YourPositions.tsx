import React, { useMemo } from 'react';
import { PaprController } from 'lib/PaprController';
import styles from './YourPositions.module.css';
import { useCurrentVault } from 'hooks/useCurrentVault/useCurrentVault';
import { useAccount, useContractRead } from 'wagmi';
import { Fieldset } from 'components/Fieldset';
import { formatTokenAmount, formatPercent } from 'lib/numberFormat';
import {
  computeLiquidationEstimation,
  computeLtv,
  convertOneScaledValue,
} from 'lib/controllers';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { erc20ABI } from 'wagmi';

const LEGEND = '🩰 Your Positions';

type YourPositionsProps = {
  paprController: PaprController;
  latestMarketPrice?: number;
};
export function YourPositions({
  paprController,
  latestMarketPrice,
}: YourPositionsProps) {
  const { address } = useAccount();
  const { data: rawPaprMEMEBalance, isFetching: balanceFetching } =
    useContractRead({
      address: paprController.debtToken.id,
      abi: erc20ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

  const paprMemeBalance = useMemo(
    () => ethers.BigNumber.from(rawPaprMEMEBalance || 0),
    [rawPaprMEMEBalance],
  );

  const { currentVault, vaultFetching } = useCurrentVault(
    paprController,
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
          paprMEMEDecimals={paprController.debtToken.decimals}
          paprMEMESymbol={paprController.debtToken.symbol}
          latestMarketPrice={latestMarketPrice}
        />
      )}
      {!!currentVault && (
        <LoanInfo paprController={paprController} vault={currentVault} />
      )}
      {paprMemeBalance.eq(0) && !currentVault && (
        <p>You do not have any positions on this controller.</p>
      )}
    </Fieldset>
  );
}

type LoanInfoProps = {
  paprController: PaprController;
  vault: NonNullable<ReturnType<typeof useCurrentVault>['currentVault']>;
};
function LoanInfo({ paprController, vault }: LoanInfoProps) {
  const { address } = useAccount();
  const liquidationEstimate = useAsyncValue(async () => {
    if (!address || !vault) {
      return null;
    }
    // TODO fix with real oracle price
    // TODO we no longer have liquidation estimates -- remove this once redo of this component goes in
    const maxDebt = ethers.BigNumber.from(0); // TODO update with real max debt
    const debtBigNumber = ethers.BigNumber.from(vault.debt);
    return computeLiquidationEstimation(debtBigNumber, maxDebt, paprController);
  }, [address, paprController, vault]);
  const target = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const maxLTV = useAsyncValue(() => paprController.maxLTV(), [paprController]);
  const formattedLTV = useMemo(() => {
    if (!target) {
      return '... LTV';
    }
    return (
      formatPercent(
        convertOneScaledValue(
          // TODO fix when we have up to date oracle price
          computeLtv(vault.debt, 1, target),
          4,
        ),
      ) + ' LTV'
    );
  }, [target, vault]);
  const formattedDebt = useMemo(() => {
    console.log(paprController.paprToken);
    return (
      formatTokenAmount(
        convertOneScaledValue(ethers.BigNumber.from(vault.debt), 4),
      ) +
      ' ' +
      paprController.debtToken.symbol
    );
  }, [vault, paprController]);
  const formattedMaxLTV = useMemo(() => {
    if (!maxLTV) {
      return '...';
    }
    return formatPercent(convertOneScaledValue(maxLTV, 4));
  }, [maxLTV]);
  return (
    <p>
      Your loan of <b>{formattedDebt}</b> is at <b>{formattedLTV}</b>.
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
