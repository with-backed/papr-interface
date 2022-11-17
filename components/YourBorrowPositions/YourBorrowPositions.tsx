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
import { getQuoteForSwap } from 'lib/controllers';
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
  currentVaults: VaultsByOwnerForControllerQuery['vaults'];
};

export function YourBorrowPositions({
  paprController,
  userNFTs,
  currentVaults,
}: YourBorrowPositionsProps) {
  const { address } = useAccount();
  const { jsonRpcProvider, tokenName } = useConfig();
  const oracleInfo = useOracleInfo();

  const uniqueCollections = useMemo(() => {
    return userNFTs
      .map((nft) => nft.address)
      .filter((item, i, arr) => arr.indexOf(item) === i);
  }, [userNFTs]);

  const maxLoanAmountInUnderlying = useAsyncValue(async () => {
    if (!oracleInfo) return null;
    const maxLoanInDebtTokens = await paprController.maxDebt(
      userNFTs.map((nft) => nft.address),
      oracleInfo,
    );
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      maxLoanInDebtTokens,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [jsonRpcProvider, tokenName, paprController, oracleInfo, userNFTs]);

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
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      totalPaprMemeDebt,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    jsonRpcProvider,
    tokenName,
    paprController.debtToken.id,
    paprController.underlying.id,
    totalPaprMemeDebt,
  ]);

  if (!oracleInfo) return <></>;

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
      {currentVaults?.map((vault) => (
        <VaultOverview
          vaultInfo={vault}
          oracleInfo={oracleInfo}
          paprController={paprController}
          key={vault.id}
        />
      ))}
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
  const { jsonRpcProvider, tokenName } = useConfig();
  const signerOrProvider = useSignerOrProvider();
  const connectedNFT = useMemo(() => {
    return ERC721__factory.connect(
      vaultInfo.collateralContract,
      signerOrProvider,
    );
  }, [vaultInfo.collateralContract, signerOrProvider]);
  const nftSymbol = useAsyncValue(() => connectedNFT.symbol(), [connectedNFT]);
  const costToClose = useAsyncValue(() => {
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      ethers.BigNumber.from(vaultInfo.debt),
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    vaultInfo.debt,
    jsonRpcProvider,
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

  return (
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
                formatBigNum(
                  costToClose,
                  paprController.underlying.decimals,
                )}{' '}
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
      </tbody>
    </Table>
  );
}
