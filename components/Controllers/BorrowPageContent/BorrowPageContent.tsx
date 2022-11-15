import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useEffect, useMemo, useState } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { AccountNFTs } from 'components/Controllers/AccountNFTs';
import { OpenVault } from 'components/Controllers/OpenVault';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useCenterNFTs } from 'hooks/useCenterNFTs';
import { TokenPerformance } from 'components/Controllers/TokenPerformance/TokenPerformance';
import { PaprController } from 'lib/PaprController';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { getUniqueNFTId } from 'lib/controllers';
import { useCurrentVault } from 'hooks/useCurrentVault/useCurrentVault';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { YourBorrowPositions } from 'components/YourBorrowPositions/YourBorrowPositions';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';

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
  const [nftsSelected, setNFTsSelected] = useState<string[]>([]);

  const maxLTVPercent = useAsyncValue(
    () => paprController.maxLTVPercent(),
    [paprController],
  );

  const { currentVault, vaultFetching } = useCurrentVault(
    paprController,
    address,
  );

  // pre-select all the user's compatible NFTs
  useEffect(() => {
    if (userCollectionNFTs.length > 0) {
      setNFTsSelected(
        userCollectionNFTs.map((nft) =>
          getUniqueNFTId(nft.address, nft.tokenId),
        ),
      );
    }
  }, [userCollectionNFTs]);

  if (!paprController || !pricesData || vaultFetching) return <></>;

  return (
    <OracleInfoProvider
      collections={userCollectionNFTs.map((nft) => nft.address)}>
      <div className={controllerStyles.wrapper}>
        <YourBorrowPositions
          userNFTs={userCollectionNFTs}
          paprController={paprController}
        />
      </div>
    </OracleInfoProvider>
  );
}
