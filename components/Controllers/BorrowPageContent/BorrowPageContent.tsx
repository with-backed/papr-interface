import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useCenterNFTs } from 'hooks/useCenterNFTs';
import { PaprController } from 'lib/PaprController';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { deconstructFromId, getUniqueNFTId } from 'lib/controllers';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { YourBorrowPositions } from 'components/YourBorrowPositions/YourBorrowPositions';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { VaultDebtPicker } from 'components/Controllers/OpenVault/VaultDebtPicker/VaultDebtPicker';
import { getAddress } from 'ethers/lib/utils';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { CreateOrRepayLoan } from 'components/CreateOrRepayLoan/CreateOrRepayLoan';
import { ethers } from 'ethers';

export type BorrowPageProps = {
  controllerAddress: string;
  pricesData: ControllerPricesData | null;
  paprController: PaprController;
  oracleInfo: { [key: string]: ReservoirResponseData };
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
    const userCollectionCollateral = userCollectionNFTs
      .map((nft) => getAddress(nft.address))
      .filter((item, i, arr) => arr.indexOf(item) === i);
    if (!currentVaults) return userCollectionCollateral;

    return currentVaults
      .map((v) => getAddress(v.collateralContract))
      .concat(userCollectionCollateral)
      .filter((item, i, arr) => arr.indexOf(item) === i);
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
<<<<<<< HEAD
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
=======
          currentVaults={currentVaults!}
          oracleInfo={oracleInfo}
        />
        {uniqueCollections.map((collection) => (
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
>>>>>>> d9fdaef (progress)
      </div>
    </OracleInfoProvider>
  );
}
