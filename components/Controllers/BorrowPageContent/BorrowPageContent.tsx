import React, { useCallback, useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { YourPositions } from 'components/YourPositions/YourPositions';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { VaultDebtPicker } from 'components/Controllers/OpenVault/VaultDebtPicker/VaultDebtPicker';
import { getAddress } from 'ethers/lib/utils';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { Activity } from '../Activity';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { useController } from 'hooks/useController';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';

export type BorrowPageProps = {
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
};

export function BorrowPageContent({ subgraphPool }: BorrowPageProps) {
  const paprController = useController();
  const config = useConfig();
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.token.id);
  }, [paprController.allowedCollateral]);

  const { userCollectionNFTs, reexecuteQuery: refreshAccountNFTs } =
    useAccountNFTs(address, collateralContractAddresses, config);

  const { currentVaults, reexecuteQuery: refreshCurrentVaults } =
    useCurrentVaults(address);

  const { balance, refresh: refreshBalance } = usePaprBalance(
    paprController.paprToken.id,
  );

  const refresh = useCallback(() => {
    refreshAccountNFTs({ requestPolicy: 'network-only' });
    refreshCurrentVaults({ requestPolicy: 'network-only' });
    refreshBalance();
  }, [refreshAccountNFTs, refreshBalance, refreshCurrentVaults]);

  const uniqueCollections = useMemo(() => {
    const userCollectionCollateral = userCollectionNFTs.map((nft) =>
      getAddress(nft.address),
    );

    if (!currentVaults) return Array.from(new Set(userCollectionCollateral));

    const userAndVaultCollateral = currentVaults
      .map((v) => getAddress(v.token.id))
      .concat(userCollectionCollateral);

    return Array.from(new Set(userAndVaultCollateral));
  }, [userCollectionNFTs, currentVaults]);

  if (!paprController || !oracleInfo) {
    return <></>;
  }

  return (
    <div className={controllerStyles.wrapper}>
      <YourPositions
        userNFTs={userCollectionNFTs}
        currentVaults={currentVaults}
        oracleInfo={oracleInfo}
        balance={balance}
      />
      {!!address &&
        uniqueCollections.map((collection) => (
          <VaultDebtPicker
            key={collection}
            collateralContractAddress={collection}
            oracleInfo={oracleInfo}
            vault={currentVaults?.find(
              (v) => getAddress(v.token.id) === getAddress(collection),
            )}
            userNFTsForVault={userCollectionNFTs.filter(
              (nft) => getAddress(collection) === getAddress(nft.address),
            )}
            refresh={refresh}
          />
        ))}
      {!!address && <Activity account={address} subgraphPool={subgraphPool} />}
    </div>
  );
}
