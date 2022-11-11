import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { Controller__factory } from 'types/generated/abis';
import { PaprController } from '../../PaprController';
import { ONE } from '../constants';

export type Vault = {
  id: ethers.BigNumber;
  debt: ethers.BigNumber;
  price: ethers.BigNumber;
  liquidationPrice: ethers.BigNumber | null; // liquidated when 1 DT = X underlying
};

export async function getVaultInfo(
  id: ethers.BigNumber,
  controller: PaprController,
  signerOrProvider: ethers.Signer | ethers.providers.Provider,
): Promise<Vault> {
  const controllerContract = Controller__factory.connect(
    controller.id,
    signerOrProvider,
  );
  const { debt, collateralValue } = await controllerContract.vaultInfo(
    id.toHexString(),
  );

  const maxLTV = await controller.maxLTVPercent();
  const maxUnderlying = collateralValue.mul(maxLTV).div(ONE);
  const liquidationPrice = debt.eq(0) ? null : maxUnderlying.div(debt);

  return {
    id,
    debt,
    price: collateralValue,
    liquidationPrice,
  };
}
