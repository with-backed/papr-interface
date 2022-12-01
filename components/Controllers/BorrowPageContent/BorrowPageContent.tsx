import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useCallback, useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { PaprController } from 'lib/PaprController';
import { YourBorrowPositions } from 'components/YourBorrowPositions/YourBorrowPositions';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { VaultDebtPicker } from 'components/Controllers/OpenVault/VaultDebtPicker/VaultDebtPicker';
import { getAddress } from 'ethers/lib/utils';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { Activity } from '../Activity';

export type BorrowPageProps = {
  controllerAddress: string;
  pricesData: ControllerPricesData | null;
  paprController: PaprController;
};

export function BorrowPageContent({
  controllerAddress,
  paprController,
  pricesData,
}: BorrowPageProps) {
  const config = useConfig();
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.contractAddress);
  }, [paprController.allowedCollateral]);

  const {
    userCollectionNFTs,
    nftsLoading,
    reexecuteQuery: refreshAccountNFTs,
  } = useAccountNFTs(address, collateralContractAddresses, config);

  const {
    currentVaults,
    vaultsFetching,
    reexecuteQuery: refreshCurrentVaults,
  } = useCurrentVaults(paprController, address);

  const refresh = useCallback(() => {
    refreshAccountNFTs({ requestPolicy: 'network-only' });
    refreshCurrentVaults({ requestPolicy: 'network-only' });
  }, [refreshAccountNFTs, refreshCurrentVaults]);

  const uniqueCollections = useMemo(() => {
    const userCollectionCollateral = userCollectionNFTs.map((nft) =>
      getAddress(nft.address),
    );

    if (!currentVaults) return Array.from(new Set(userCollectionCollateral));

    const userAndVaultCollateral = currentVaults
      .map((v) => getAddress(v.collateralContract))
      .concat(userCollectionCollateral);

    return Array.from(new Set(userAndVaultCollateral));
  }, [userCollectionNFTs, currentVaults]);

  const vaultIds = useMemo(
    () => new Set(currentVaults?.map((v) => v.id)),
    [currentVaults],
  );

  if (
    !paprController ||
    !pricesData ||
    vaultsFetching ||
    nftsLoading ||
    !oracleInfo
  )
    return <></>;

  return (
    <div className={controllerStyles.wrapper}>
      <YourBorrowPositions
        userNFTs={userCollectionNFTs}
        paprController={paprController}
        currentVaults={currentVaults}
        oracleInfo={oracleInfo}
      />
      {!!address &&
        uniqueCollections.map((collection) => (
          <VaultDebtPicker
            key={collection}
            collateralContractAddress={collection}
            oracleInfo={oracleInfo}
            paprController={paprController}
            vault={currentVaults?.find(
              (v) =>
                getAddress(v.collateralContract) === getAddress(collection),
            )}
            userNFTsForVault={userCollectionNFTs.filter(
              (nft) => getAddress(collection) === getAddress(nft.address),
            )}
            refresh={refresh}
          />
        ))}
      {!!currentVaults && (
        <Activity paprController={paprController} vaultIds={vaultIds} />
      )}
    </div>
  );
}
