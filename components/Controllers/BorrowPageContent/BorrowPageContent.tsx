import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useCenterNFTs } from 'hooks/useCenterNFTs';
import { PaprController } from 'lib/PaprController';
import { YourBorrowPositions } from 'components/YourBorrowPositions/YourBorrowPositions';
import {
  OracleInfo,
  OracleInfoProvider,
} from 'hooks/useOracleInfo/useOracleInfo';
import { VaultDebtPicker } from 'components/Controllers/OpenVault/VaultDebtPicker/VaultDebtPicker';
import { getAddress } from 'ethers/lib/utils';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';

export type BorrowPageProps = {
  controllerAddress: string;
  pricesData: ControllerPricesData | null;
  paprController: PaprController;
  oracleInfo: OracleInfo;
};

export function BorrowPageContent({
  controllerAddress,
  paprController,
  pricesData,
  oracleInfo,
}: BorrowPageProps) {
  const config = useConfig();
  const { address } = useAccount();

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.contractAddress);
  }, [paprController.allowedCollateral]);

  const { userCollectionNFTs, nftsLoading } = useCenterNFTs(
    address,
    collateralContractAddresses,
    config,
  );

  const { currentVaults, vaultsFetching } = useCurrentVaults(
    paprController,
    address,
  );

  const uniqueCollections = useMemo(() => {
    const userCollectionCollateral = userCollectionNFTs.map((nft) =>
      getAddress(nft.address),
    );

    if (!currentVaults) return userCollectionCollateral;

    const userAndVaultCollateral = currentVaults
      .map((v) => getAddress(v.collateralContract))
      .concat(userCollectionCollateral);

    return Array.from(new Set(userAndVaultCollateral));
  }, [userCollectionNFTs, currentVaults]);

  if (!paprController || !pricesData || vaultsFetching || nftsLoading)
    return <></>;

  return (
    <OracleInfoProvider
      collections={paprController.allowedCollateral.map(
        (nft) => nft.contractAddress,
      )}>
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
            />
          ))}
      </div>
    </OracleInfoProvider>
  );
}
