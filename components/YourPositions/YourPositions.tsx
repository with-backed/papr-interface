import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useLTV } from 'hooks/useLTV';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { OracleInfo, useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { SupportedToken } from 'lib/config';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { formatBigNum, formatTokenAmount } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useMemo } from 'react';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { useAccount } from 'wagmi';

import styles from './YourPositions.module.css';

export function YourPositions() {
  const { address } = useAccount();
  const { tokenName } = useConfig();
  const paprController = useController();

  const latestMarketPrice = useLatestMarketPrice();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const { balance } = usePaprBalance(paprController.paprToken.id);
  const { currentVaults } = useCurrentVaults(address);

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.token.id);
  }, [paprController.allowedCollateral]);

  const { userCollectionNFTs } = useAccountNFTs(
    address,
    collateralContractAddresses,
  );

  const uniqueCollections = useMemo(() => {
    const vaultAndUserAddresses = userCollectionNFTs
      .map((nft) => getAddress(nft.address))
      .concat((currentVaults || []).map((v) => getAddress(v.token.id)));
    return Array.from(new Set(vaultAndUserAddresses));
  }, [userCollectionNFTs, currentVaults]);

  const collateralAssets = useMemo(
    () =>
      userCollectionNFTs
        .map((nft) => nft.address)
        .concat(
          (currentVaults || [])
            .map((v) =>
              Array(v.collateralCount)
                .fill('')
                .map((_) => getAddress(v.token.id))
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
        .map((v) => ethers.BigNumber.from(v.debt))
        .reduce((a, b) => a.add(b), ethers.BigNumber.from(0)),
    );
    return maxLoanMinusCurrentDebt.isNegative()
      ? ethers.BigNumber.from(0)
      : maxLoanMinusCurrentDebt;
  }, [currentVaults, maxLoanInDebtTokens]);

  const maxLoanAmountInUnderlying = useMemo(() => {
    if (!maxLoanMinusCurrentDebt || !latestMarketPrice) {
      return null;
    }

    return (
      parseFloat(
        ethers.utils.formatUnits(
          maxLoanMinusCurrentDebt,
          paprController.paprToken.decimals,
        ),
      ) * latestMarketPrice
    ).toFixed(5);
  }, [
    latestMarketPrice,
    maxLoanMinusCurrentDebt,
    paprController.paprToken.decimals,
  ]);

  const totalPaprMemeDebt = useMemo(() => {
    if (!currentVaults) return ethers.BigNumber.from(0);
    return currentVaults
      .map((vault) => vault.debt)
      .reduce(
        (a, b) => ethers.BigNumber.from(a).add(ethers.BigNumber.from(b)),
        ethers.BigNumber.from(0),
      );
  }, [currentVaults]);

  const totalPaprMemeDebtInUnderlying = useAsyncValue(async () => {
    if (totalPaprMemeDebt.isZero()) return null;
    return getQuoteForSwap(
      totalPaprMemeDebt,
      paprController.paprToken.id,
      paprController.underlying.id,
      tokenName as SupportedToken,
    );
  }, [
    tokenName,
    paprController.paprToken.id,
    paprController.underlying.id,
    totalPaprMemeDebt,
  ]);

  if (!address) {
    return (
      <Fieldset legend={`🧮 YOUR ${tokenName} POSITIONS`}>
        <div>
          <p>
            Connect your wallet to see eligible collections and your maximum
            loan amount
          </p>
        </div>
      </Fieldset>
    );
  }

  return (
    <Fieldset legend={`🧮 YOUR ${tokenName} POSITIONS`}>
      <BalanceInfo balance={balance} />
      <div>
        Based on the NFTs in your wallet, you&apos;re eligible for loans from{' '}
        {uniqueCollections.length} collection(s), with a max loan amount of{' '}
        {!maxLoanAmountInUnderlying && <span>...</span>}
        {maxLoanAmountInUnderlying && (
          <>
            {maxLoanAmountInUnderlying} {paprController.underlying.symbol}
          </>
        )}
      </div>
      <div>{totalPaprMemeDebt.isZero() && <p>No {tokenName} loans yet</p>}</div>
      <div className={styles.paragraphs}>
        {!totalPaprMemeDebt.isZero() && totalPaprMemeDebtInUnderlying && (
          <p>
            You owe{' '}
            <b>
              {formatBigNum(
                totalPaprMemeDebt,
                paprController.paprToken.decimals,
              )}{' '}
              {paprController.paprToken.symbol}
            </b>{' '}
            worth{' '}
            <b>
              {formatBigNum(
                totalPaprMemeDebtInUnderlying,
                paprController.underlying.decimals,
              )}{' '}
              {paprController.underlying.symbol}
            </b>
          </p>
        )}
      </div>
      {currentVaults && (
        <Table className={styles.vaultTable}>
          <thead>
            <tr>
              <th>
                <p>COLLECTION</p>
              </th>
              <th>
                <p>NFTS</p>
              </th>
              <th>
                <p>BORROWED</p>
              </th>
              <th>
                <p>CLOSING COST</p>
              </th>
              <th>
                <p>HEALTH</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {!!oracleInfo &&
              currentVaults.map((vault) => (
                <VaultOverview
                  vaultInfo={vault}
                  oracleInfo={oracleInfo}
                  key={vault.id}
                />
              ))}
          </tbody>
        </Table>
      )}
    </Fieldset>
  );
}

type VaultOverviewProps = {
  oracleInfo: OracleInfo;
  vaultInfo: VaultsByOwnerForControllerQuery['vaults']['0'];
};

export function VaultOverview({ vaultInfo }: VaultOverviewProps) {
  const { tokenName } = useConfig();
  const ltv = useLTV(
    vaultInfo.token.id,
    vaultInfo.collateralCount,
    vaultInfo.debt,
  );
  const { paprToken, underlying } = useController();
  const nftSymbol = vaultInfo.token.symbol;
  const costToClose = useAsyncValue(async () => {
    if (ethers.BigNumber.from(vaultInfo.debt).isZero())
      return ethers.BigNumber.from(0);
    return getQuoteForSwapOutput(
      ethers.BigNumber.from(vaultInfo.debt),
      underlying.id,
      paprToken.id,
      tokenName as SupportedToken,
    );
  }, [vaultInfo.debt, tokenName, paprToken.id, underlying.id]);

  if (
    ethers.BigNumber.from(vaultInfo.debt).isZero() &&
    vaultInfo.collateral.length === 0
  )
    return <></>;

  return (
    <tr>
      <td>
        <p>{nftSymbol}</p>
      </td>
      <td>
        <p>{vaultInfo.collateral.length}</p>
      </td>
      <td>
        <p>
          {formatBigNum(vaultInfo.debt, paprToken.decimals)} {paprToken.symbol}
        </p>
      </td>
      <td>
        <p>
          {costToClose && formatBigNum(costToClose, underlying.decimals)}{' '}
          {underlying.symbol}
        </p>
      </td>
      <td>
        <VaultHealth ltv={ltv || 0} />
      </td>
    </tr>
  );
}

type BalanceInfoProps = {
  balance: ethers.BigNumber | null;
};
function BalanceInfo({ balance }: BalanceInfoProps) {
  const { paprToken, underlying } = useController();
  const latestMarketPrice = useLatestMarketPrice();
  const paprMemeBalance = useMemo(
    () => ethers.BigNumber.from(balance || 0),
    [balance],
  );

  const formattedBalance = useMemo(() => {
    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(paprMemeBalance, paprToken.decimals),
    );
    return formatTokenAmount(convertedBalance) + ` ${paprToken.symbol}`;
  }, [paprMemeBalance, paprToken]);
  const formattedValue = useMemo(() => {
    if (!latestMarketPrice) {
      return 'an unknown amount of WETH (no market data available)';
    }

    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(paprMemeBalance, paprToken.decimals),
    );
    return (
      formatTokenAmount(convertedBalance * latestMarketPrice) +
      ` ${underlying.symbol}`
    );
  }, [paprToken, paprMemeBalance, latestMarketPrice, underlying.symbol]);
  return (
    <p>
      You hold <b>{formattedBalance}</b> worth <b>{formattedValue}</b>.
    </p>
  );
}
