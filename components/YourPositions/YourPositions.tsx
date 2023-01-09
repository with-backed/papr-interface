import styles from './YourPositions.module.css';
import { AccountNFTsResponse } from 'hooks/useAccountNFTs';
import { Fieldset } from 'components/Fieldset';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { SupportedToken } from 'lib/config';
import { useConfig } from 'hooks/useConfig';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { Table } from 'components/Table';
import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { getAddress } from 'ethers/lib/utils';
import { formatBigNum, formatTokenAmount } from 'lib/numberFormat';
import { useLTV } from 'hooks/useLTV';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { useController } from 'hooks/useController';

export type YourPositionsProps = {
  userNFTs: AccountNFTsResponse[];
  currentVaults: VaultsByOwnerForControllerQuery['vaults'] | null;
  oracleInfo: OracleInfo;
  latestMarketPrice: number;
  balance: ethers.BigNumber | null;
};

export function YourPositions({
  userNFTs,
  currentVaults,
  oracleInfo,
  latestMarketPrice,
  balance,
}: YourPositionsProps) {
  const { address } = useAccount();
  const { tokenName } = useConfig();
  const paprController = useController();

  const uniqueCollections = useMemo(() => {
    const vaultAndUserAddresses = userNFTs
      .map((nft) => getAddress(nft.address))
      .concat((currentVaults || []).map((v) => getAddress(v.token.id)));
    return Array.from(new Set(vaultAndUserAddresses));
  }, [userNFTs, currentVaults]);

  const collateralAssets = useMemo(
    () =>
      userNFTs
        .map((nft) => nft.address)
        .concat((currentVaults || []).map((v) => getAddress(v.token.id))),
    [currentVaults, userNFTs],
  );

  const maxLoanInDebtTokens = useMaxDebt(collateralAssets);

  const maxLoanMinusCurrentDebt = useMemo(() => {
    if (!maxLoanInDebtTokens) {
      return null;
    }
    return maxLoanInDebtTokens.sub(
      (currentVaults || [])
        .map((v) => ethers.BigNumber.from(v.debt))
        .reduce((a, b) => a.add(b), ethers.BigNumber.from(0)),
    );
  }, [currentVaults, maxLoanInDebtTokens]);

  const maxLoanAmountInUnderlying = useMemo(() => {
    if (!maxLoanMinusCurrentDebt) {
      return null;
    }

    return (
      parseFloat(
        ethers.utils.formatUnits(
          maxLoanMinusCurrentDebt,
          paprController.paprToken.decimals,
        ),
      ) * latestMarketPrice
    );
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

  if (!oracleInfo) return <></>;

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
      <BalanceInfo latestMarketPrice={latestMarketPrice} balance={balance} />
      <div>
        Based on the NFTs in your wallet, you&apos;re eligible for loans from{' '}
        {uniqueCollections.length} collection(s), with a max loan amount of{' '}
        {!maxLoanAmountInUnderlying && <span>...</span>}
        {maxLoanAmountInUnderlying && <>${maxLoanAmountInUnderlying}</>}
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
              {tokenName}
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
            {currentVaults.map((vault) => (
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
    vaultInfo.collateral[0].id,
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
          {formatBigNum(vaultInfo.debt, paprToken.decimals)} {tokenName}
        </p>
      </td>
      <td>
        <p>${costToClose && formatBigNum(costToClose, underlying.decimals)} </p>
      </td>
      <td>
        <VaultHealth ltv={ltv || 0} />
      </td>
    </tr>
  );
}

type BalanceInfoProps = {
  balance: ethers.BigNumber | null;
  latestMarketPrice?: number;
};
function BalanceInfo({ balance, latestMarketPrice }: BalanceInfoProps) {
  const { paprToken } = useController();
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
      return 'an unknown amount of USDC (no market data available)';
    }

    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(paprMemeBalance, paprToken.decimals),
    );
    return formatTokenAmount(convertedBalance * latestMarketPrice) + ' USDC';
  }, [paprToken, paprMemeBalance, latestMarketPrice]);
  return (
    <p>
      You hold <b>{formattedBalance}</b> worth <b>{formattedValue}</b>.
    </p>
  );
}
