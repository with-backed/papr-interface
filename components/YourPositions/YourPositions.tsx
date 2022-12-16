import { VaultHealth } from 'components/Controllers/Loans/VaultHealth';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { AccountNFTsResponse } from 'hooks/useAccountNFTs';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useLTVs } from 'hooks/useLTVs/useLTVs';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { SupportedToken } from 'lib/config';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { formatBigNum, formatTokenAmount } from 'lib/numberFormat';
import { PaprController } from 'lib/PaprController';
import { useMemo } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { useAccount } from 'wagmi';

import styles from './YourPositions.module.css';

export type YourPositionsProps = {
  paprController: PaprController;
  userNFTs: AccountNFTsResponse[];
  currentVaults: VaultsByOwnerForControllerQuery['vaults'] | null;
  oracleInfo: OracleInfo;
  latestMarketPrice: number;
  balance: ethers.BigNumber | null;
};

export function YourPositions({
  paprController,
  userNFTs,
  currentVaults,
  oracleInfo,
  latestMarketPrice,
  balance,
}: YourPositionsProps) {
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

    return (
      parseFloat(
        ethers.utils.formatUnits(
          maxLoanMinusCurrentDebt,
          paprController.debtToken.decimals,
        ),
      ) * latestMarketPrice
    );
  }, [paprController, oracleInfo, userNFTs, currentVaults, latestMarketPrice]);

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
      <BalanceInfo
        paprController={paprController}
        latestMarketPrice={latestMarketPrice}
        balance={balance}
      />
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
                paprController={paprController}
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
  const maxLTV = useMemo(() => paprController.maxLTVBigNum, [paprController]);
  const { ltvs } = useLTVs(
    paprController,
    useMemo(() => [vaultInfo], [vaultInfo]),
    maxLTV,
  );
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
        {maxLTV && (
          <VaultHealth ltv={ltvs[vaultInfo.id] || 0} maxLtv={maxLTV} />
        )}
      </td>
    </tr>
  );
}

type BalanceInfoProps = {
  balance: ethers.BigNumber | null;
  paprController: PaprController;
  latestMarketPrice?: number;
};
function BalanceInfo({
  balance,
  paprController,
  latestMarketPrice,
}: BalanceInfoProps) {
  const paprMemeBalance = useMemo(
    () => ethers.BigNumber.from(balance || 0),
    [balance],
  );

  const formattedBalance = useMemo(() => {
    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(
        paprMemeBalance,
        paprController.debtToken.decimals,
      ),
    );
    return (
      formatTokenAmount(convertedBalance) +
      ` ${paprController.debtToken.symbol}`
    );
  }, [paprMemeBalance, paprController.debtToken]);
  const formattedValue = useMemo(() => {
    if (!latestMarketPrice) {
      return 'an unknown amount of USDC (no market data available)';
    }

    const convertedBalance = parseFloat(
      ethers.utils.formatUnits(
        paprMemeBalance,
        paprController.debtToken.decimals,
      ),
    );
    return formatTokenAmount(convertedBalance * latestMarketPrice) + ' USDC';
  }, [paprController.debtToken, paprMemeBalance, latestMarketPrice]);
  return (
    <p>
      You hold <b>{formattedBalance}</b> worth <b>{formattedValue}</b>.
    </p>
  );
}
