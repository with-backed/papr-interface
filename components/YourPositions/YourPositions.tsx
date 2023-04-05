import { BigNumber } from '@ethersproject/bignumber';
import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { Fieldset } from 'components/Fieldset';
import { NFTMarquee } from 'components/NFTMarquee';
import { Table } from 'components/Table';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { formatUnits, getAddress } from 'ethers/lib/utils';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { useETHToUSDPrice } from 'hooks/useETHToUSDPrice';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { formatBigNum, formatTokenAmount } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import Link from 'next/link';
import { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { SubgraphVault } from 'types/SubgraphVault';
import { useAccount, useNetwork } from 'wagmi';

import styles from './YourPositions.module.css';

type YourPositionsProps = {
  onPerformancePage: boolean;
};

export function YourPositions({ onPerformancePage }: YourPositionsProps) {
  const { address } = useAccount();
  const { tokenName, chainId } = useConfig();
  const { chain } = useNetwork();
  const { paprToken, underlying, allowedCollateral } = useController();

  const latestMarketPrice = useLatestMarketPrice();
  const ethUSDPrice = useETHToUSDPrice();
  const { balance } = usePaprBalance(paprToken.id);
  const { currentVaults } = useCurrentVaults(address);

  const wrongNetwork = useMemo(() => {
    return chain?.id !== chainId;
  }, [chain?.id, chainId]);

  const collateralContractAddresses = useMemo(() => {
    return allowedCollateral.map((ac) => ac.token.id);
  }, [allowedCollateral]);

  const { userCollectionNFTs } = useAccountNFTs(
    address,
    collateralContractAddresses,
  );

  const collateralAssets = useMemo(
    () =>
      userCollectionNFTs
        .map((nft) => nft.address)
        .concat(
          (currentVaults || [])
            .map((v) =>
              Array(v.collateralCount)
                .fill('')
                .map(() => getAddress(v.token.id))
                .flat(),
            )
            .flat(),
        ),
    [currentVaults, userCollectionNFTs],
  );

  const maxLoanInDebtTokens = useMaxDebt(
    collateralAssets,
    OraclePriceType.lower,
  );

  const maxLoanMinusCurrentDebt = useMemo(() => {
    if (!maxLoanInDebtTokens) {
      return null;
    }
    const maxLoanMinusCurrentDebt = maxLoanInDebtTokens.sub(
      (currentVaults || [])
        .map((v) => BigNumber.from(v.debt))
        .reduce((a, b) => a.add(b), BigNumber.from(0)),
    );
    return maxLoanMinusCurrentDebt.isNegative()
      ? BigNumber.from(0)
      : maxLoanMinusCurrentDebt;
  }, [currentVaults, maxLoanInDebtTokens]);

  const formattedMaxLoan = useMemo(() => {
    if (!maxLoanMinusCurrentDebt) {
      return '...';
    }
    return formatBigNum(maxLoanMinusCurrentDebt, paprToken.decimals, 4);
  }, [maxLoanMinusCurrentDebt, paprToken.decimals]);

  const maxLoanAmountInUnderlying = useMemo(() => {
    if (!maxLoanMinusCurrentDebt || !latestMarketPrice) {
      return '...';
    }

    return (parseFloat(formattedMaxLoan) * latestMarketPrice).toFixed(4);
  }, [latestMarketPrice, formattedMaxLoan, maxLoanMinusCurrentDebt]);

  const totalPaprMemeDebt: ethers.BigNumber = useMemo(() => {
    if (!currentVaults) return BigNumber.from(0);
    return currentVaults
      .map((vault) => vault.debt)
      .reduce(
        (a, b) => BigNumber.from(a).add(BigNumber.from(b)),
        BigNumber.from(0),
      );
  }, [currentVaults]);

  const formattedTotalPaprMemeDebt = useMemo(() => {
    return formatBigNum(totalPaprMemeDebt, paprToken.decimals, 4);
  }, [totalPaprMemeDebt, paprToken.decimals]);

  const totalPaprMemeDebtInUnderlying = useMemo(() => {
    if (!latestMarketPrice) return '...';
    return (parseFloat(formattedTotalPaprMemeDebt) * latestMarketPrice).toFixed(
      4,
    );
  }, [formattedTotalPaprMemeDebt, latestMarketPrice]);

  if (!address || wrongNetwork) {
    return (
      <Fieldset legend={`🧮 YOUR ${tokenName} POSITIONS`}>
        <div>
          {!address && (
            <p>
              Connect your wallet to see eligible collections and your maximum
              loan amount
            </p>
          )}
          {wrongNetwork && !!address && (
            <p>
              Switch your wallet to the correct network to see eligible
              collections and your maximum loan amount
            </p>
          )}
        </div>
      </Fieldset>
    );
  }

  return (
    <Fieldset legend={`🧮 YOUR ${tokenName} POSITIONS`}>
      <BalanceInfo balance={balance} />
      <p>
        Existing debt: You owe {formattedTotalPaprMemeDebt} {paprToken.symbol} (
        {totalPaprMemeDebtInUnderlying} {underlying.symbol})
      </p>
      <p>
        New debt: Borrow up to {formattedMaxLoan} {paprToken.symbol} (
        {maxLoanAmountInUnderlying} {underlying.symbol})
      </p>
      {onPerformancePage && (
        <p>
          View your activity on the{' '}
          <Link href={`/tokens/${tokenName}/borrow`}>Borrow</Link> page
        </p>
      )}
      {currentVaults && (
        <Table className={styles.vaultTable}>
          <thead>
            <tr>
              <th></th>
              <th>
                <p>BORROWED</p>
              </th>
              <th>
                <p>DEBT VALUE</p>
              </th>
              <th>
                <p>HEALTH</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentVaults.map((vault) => (
              <VaultOverview
                vaultInfo={vault}
                key={vault.id}
                ethUSDPrice={ethUSDPrice}
              />
            ))}
          </tbody>
        </Table>
      )}
    </Fieldset>
  );
}

type VaultOverviewProps = {
  vaultInfo: SubgraphVault;
  ethUSDPrice: number | undefined;
};

export function VaultOverview({ vaultInfo, ethUSDPrice }: VaultOverviewProps) {
  const latestMarketPrice = useLatestMarketPrice();
  const { paprToken, underlying } = useController();
  const debtValue = useMemo(() => {
    if (!latestMarketPrice) return null;
    return (
      parseFloat(formatUnits(vaultInfo.debt, paprToken.decimals)) *
      latestMarketPrice
    );
  }, [vaultInfo.debt, latestMarketPrice, paprToken.decimals]);

  const borrowedUSDTooltip = useTooltipState({
    placement: 'bottom',
  });
  const borrowedInUSD = useMemo(() => {
    if (!debtValue || !ethUSDPrice) return null;
    return debtValue * ethUSDPrice;
  }, [debtValue, ethUSDPrice]);

  if (
    BigNumber.from(vaultInfo.debt).isZero() &&
    vaultInfo.collateral.length === 0
  )
    return <></>;

  return (
    <tr>
      <td>
        <NFTMarquee collateral={vaultInfo.collateral} />
      </td>
      <td>
        {formatBigNum(vaultInfo.debt, paprToken.decimals, 4)} {paprToken.symbol}
      </td>
      <td>
        <TooltipReference {...borrowedUSDTooltip}>
          {debtValue ? debtValue.toFixed(4) : '...'} {underlying.symbol}
        </TooltipReference>
        <Tooltip {...borrowedUSDTooltip}>
          {borrowedInUSD ? `$${borrowedInUSD.toFixed(2)}` : '...'}
        </Tooltip>
      </td>
      <td>
        <VaultHealth vault={vaultInfo} />
      </td>
    </tr>
  );
}

type BalanceInfoProps = {
  balance: BigNumber | null;
};
function BalanceInfo({ balance }: BalanceInfoProps) {
  const { paprToken, underlying } = useController();
  const latestMarketPrice = useLatestMarketPrice();
  const paprMemeBalance = useMemo(
    () => BigNumber.from(balance || 0),
    [balance],
  );

  const formattedBalance = useMemo(() => {
    const convertedBalance = parseFloat(
      formatUnits(paprMemeBalance, paprToken.decimals),
    );
    return formatTokenAmount(convertedBalance) + ` ${paprToken.symbol}`;
  }, [paprMemeBalance, paprToken]);
  const formattedValue = useMemo(() => {
    if (!latestMarketPrice) {
      return 'an unknown amount of WETH (no market data available)';
    }

    const convertedBalance = parseFloat(
      formatUnits(paprMemeBalance, paprToken.decimals),
    );
    return (
      formatTokenAmount(convertedBalance * latestMarketPrice) +
      ` ${underlying.symbol}`
    );
  }, [paprToken, paprMemeBalance, latestMarketPrice, underlying.symbol]);
  return (
    <p>
      Wallet balance: You hold {formattedBalance} ({formattedValue})
    </p>
  );
}
