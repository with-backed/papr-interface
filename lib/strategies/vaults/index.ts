import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { Strategy__factory } from 'types/generated/abis';
import { LendingStrategy } from '../../LendingStrategy';
import { ONE } from '../constants';

export type Vault = {
  id: ethers.BigNumber;
  debt: ethers.BigNumber;
  price: ethers.BigNumber;
  liquidationPrice: ethers.BigNumber | null; // liquidated when 1 DT = X underlying
};

export async function getVaultInfo(
  id: ethers.BigNumber,
  strategy: LendingStrategy,
  signerOrProvider: ethers.Signer | ethers.providers.Provider,
): Promise<Vault> {
  const strategyContract = Strategy__factory.connect(
    strategy.id,
    signerOrProvider,
  );
  const { debt, collateralValue } = await strategyContract.vaultInfo(
    id.toHexString(),
  );

  const maxLTV = await strategy.maxLTVPercent();
  const maxUnderlying = collateralValue.mul(maxLTV).div(ONE);
  const liquidationPrice = debt.eq(0) ? null : maxUnderlying.div(debt);

  return {
    id,
    debt,
    price: collateralValue,
    liquidationPrice,
  };
}
