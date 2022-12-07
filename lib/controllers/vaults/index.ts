import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { PaprController__factory } from 'types/generated/abis';
import { PaprController } from '../../PaprController';
import { ONE } from '../constants';

export type Vault = {
  account: string;
  asset: string;
  debt: ethers.BigNumber;
  count: number;
  liquidationPrice: ethers.BigNumber | null; // liquidated when 1 DT = X underlying
};

export async function getVaultInfo(
  account: string,
  asset: string,
  controller: PaprController,
  signerOrProvider: ethers.Signer | ethers.providers.Provider,
): Promise<Vault> {
  const controllerContract = PaprController__factory.connect(
    controller.id,
    signerOrProvider,
  );
  const { debt, count } = await controllerContract.vaultInfo(account, asset);

  const maxLTV = controller.maxLTVPercent();
  // TODO need oracle price
  const collateralValue = ethers.BigNumber.from(count * 1);
  const maxUnderlying = collateralValue.mul(maxLTV).div(ONE);
  const liquidationPrice = debt.eq(0) ? null : maxUnderlying.div(debt);

  return {
    account,
    asset,
    debt,
    count,
    liquidationPrice,
  };
}
