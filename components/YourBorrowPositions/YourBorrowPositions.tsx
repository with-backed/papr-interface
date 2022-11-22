import styles from './YourBorrowPositions.module.css';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { Fieldset } from 'components/Fieldset';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { PaprController } from 'lib/PaprController';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { OracleInfo, useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { Quoter } from 'lib/contracts';
import { SupportedToken } from 'lib/config';
import { useConfig } from 'hooks/useConfig';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { Table } from 'components/Table';
import { ERC721__factory } from 'types/generated/abis';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { NewVaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { getAddress } from 'ethers/lib/utils';
import { formatBigNum } from 'lib/numberFormat';

export type YourBorrowPositionsProps = {
  paprController: PaprController;
  userNFTs: CenterUserNFTsResponse[];
  currentVaults: VaultsByOwnerForControllerQuery['vaults'] | null;
  oracleInfo: OracleInfo;
};

export function YourBorrowPositions({
  paprController,
  userNFTs,
  currentVaults,
  oracleInfo,
}: YourBorrowPositionsProps) {
  const { address } = useAccount();
  const { tokenName } = useConfig();

  const uniqueCollections = useMemo(() => {
    const vaultAndUserAddresses = userNFTs
      .map((nft) => getAddress(nft.address))
      .concat(
        (currentVaults || [])
          .map((v) => v.collateral)
          .flat()
          .map((c) => getAddress(c.contractAddress)),
      );
    return Array.from(new Set(vaultAndUserAddresses));
  }, [userNFTs, currentVaults]);

  const maxLoanAmountInUnderlying = useAsyncValue(async () => {
    const maxLoanInDebtTokens = await paprController.maxDebt(
      userNFTs
        .map((nft) => nft.address)
        .concat(
          (currentVaults || [])
            .map((v) => v.collateral)
            .flat()
            .map((c) => c.contractAddress),
        ),
      oracleInfo,
    );
    const maxLoanMinusCurrentDebt = maxLoanInDebtTokens.sub(
      (currentVaults || [])
        .map((v) => ethers.BigNumber.from(v.debt))
        .reduce((a, b) => a.add(b), ethers.BigNumber.from(0)),
    );

    if (maxLoanMinusCurrentDebt.isZero()) return ethers.BigNumber.from(0);
    return getQuoteForSwap(
      maxLoanMinusCurrentDebt,
      paprController.debtToken.id,
      paprController.underlying.id,
      tokenName as SupportedToken,
    );
  }, [tokenName, paprController, oracleInfo, userNFTs, currentVaults]);

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
      paprController.debtToken.id,
      paprController.underlying.id,
      tokenName as SupportedToken,
    );
  }, [
    tokenName,
    paprController.debtToken.id,
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
      <div>{totalPaprMemeDebt.isZero() && <p>No {tokenName} loans yet</p>}</div>
      <div>
        {!totalPaprMemeDebt.isZero() && totalPaprMemeDebtInUnderlying && (
          <p>
            You hold{' '}
            <b>
              {formatBigNum(
                totalPaprMemeDebt,
                paprController.debtToken.decimals,
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
      <div>
        Based on the NFTs in your wallet, you&apos;re eligible for loans from{' '}
        {uniqueCollections.length} collection(s), with a max loan amount of{' '}
        {!maxLoanAmountInUnderlying && <span>...</span>}
        {maxLoanAmountInUnderlying && (
          <>
            $
            {formatBigNum(
              maxLoanAmountInUnderlying,
              paprController.underlying.decimals,
            )}
          </>
        )}
      </div>
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
          {currentVaults?.map((vault) => (
            <VaultOverview
              vaultInfo={vault}
              oracleInfo={oracleInfo}
              paprController={paprController}
              key={vault.id}
            />
          ))}
        </tbody>
      </Table>
    </Fieldset>
  );
}

type VaultOverviewProps = {
  paprController: PaprController;
  oracleInfo: OracleInfo;
  vaultInfo: VaultsByOwnerForControllerQuery['vaults']['0'];
};

export function VaultOverview({
  paprController,
  oracleInfo,
  vaultInfo,
}: VaultOverviewProps) {
  const { tokenName } = useConfig();
  const signerOrProvider = useSignerOrProvider();
  const connectedNFT = useMemo(() => {
    return ERC721__factory.connect(
      vaultInfo.collateralContract,
      signerOrProvider,
    );
  }, [vaultInfo.collateralContract, signerOrProvider]);
  const nftSymbol = useAsyncValue(() => connectedNFT.symbol(), [connectedNFT]);
  const costToClose = useAsyncValue(async () => {
    if (ethers.BigNumber.from(vaultInfo.debt).isZero())
      return ethers.BigNumber.from(0);
    return getQuoteForSwapOutput(
      ethers.BigNumber.from(vaultInfo.debt),
      paprController.underlying.id,
      paprController.debtToken.id,
      tokenName as SupportedToken,
    );
  }, [
    vaultInfo.debt,
    tokenName,
    paprController.debtToken.id,
    paprController.underlying.id,
  ]);

  const maxDebtForVault = useAsyncValue(() => {
    return paprController.maxDebt(
      vaultInfo.collateral.map((c) => getAddress(c.contractAddress)),
      oracleInfo,
    );
  }, [paprController, vaultInfo, oracleInfo]);

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
          {formatBigNum(vaultInfo.debt, paprController.debtToken.decimals)}{' '}
          {tokenName}
        </p>
      </td>
      <td>
        <p>
          $
          {costToClose &&
            formatBigNum(costToClose, paprController.underlying.decimals)}{' '}
        </p>
      </td>
      <td>
        {maxDebtForVault && (
          <NewVaultHealth
            debt={ethers.BigNumber.from(vaultInfo.debt)}
            maxDebt={maxDebtForVault}
          />
        )}
      </td>
    </tr>
  );
}
