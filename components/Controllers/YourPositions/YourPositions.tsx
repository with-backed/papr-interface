import React, { useMemo } from 'react';
import { PaprController } from 'lib/PaprController';
import styles from './YourPositions.module.css';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { useAccount, useContractRead } from 'wagmi';
import { Fieldset } from 'components/Fieldset';
import { formatTokenAmount } from 'lib/numberFormat';
import { ethers } from 'ethers';
import { erc20ABI } from 'wagmi';

const LEGEND = '🧮 Your Positions';

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

  const { currentVaults, vaultsFetching } = useCurrentVaults(
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

  if (vaultsFetching || balanceFetching) {
    return <Fieldset legend={LEGEND}>Loading...</Fieldset>;
  }

  return (
    <Fieldset legend={LEGEND}>
      {!paprMemeBalance.eq(0) && (
        <BalanceInfo
          paprMEMEBalance={paprMemeBalance}
          paprMEMEDecimals={paprController.debtToken.decimals}
          paprMEMESymbol={paprController.debtToken.symbol}
          numberOfVaults={currentVaults?.length || 0}
          latestMarketPrice={latestMarketPrice}
        />
      )}
      {paprMemeBalance.eq(0) && !currentVaults && (
        <p>You do not have any positions on this controller.</p>
      )}
    </Fieldset>
  );
}

type BalanceInfoProps = {
  paprMEMEBalance: ethers.BigNumber;
  paprMEMEDecimals: number;
  paprMEMESymbol: string;
  numberOfVaults: number;
  latestMarketPrice?: number;
};
function BalanceInfo({
  paprMEMEBalance,
  paprMEMEDecimals,
  paprMEMESymbol,
  numberOfVaults,
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
      You hold <b>{formattedBalance}</b> across {numberOfVaults} vault(s). Cost
      to repay is <b>{formattedValue}</b>.
    </p>
  );
}
