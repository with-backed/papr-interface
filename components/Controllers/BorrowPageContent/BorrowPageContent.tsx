import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useCenterNFTs } from 'hooks/useCenterNFTs';
import { PaprController } from 'lib/PaprController';
import { YourBorrowPositions } from 'components/YourBorrowPositions/YourBorrowPositions';

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

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.contractAddress);
  }, [paprController.allowedCollateral]);

  const { userCollectionNFTs } = useCenterNFTs(
    address,
    collateralContractAddresses,
    config,
  );

  if (!paprController || !pricesData) return <></>;

  return (
    <div className={controllerStyles.wrapper}>
      <YourBorrowPositions
        userNFTs={userCollectionNFTs}
        paprController={paprController}
      />
    </div>
  );
}
