import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { ERC721, Strategy__factory } from 'types/generated/abis';
import { LendingStrategy, populateLendingStrategy } from '..';
import { ONE } from '../constants';

export type Vault = {
  id: ethers.BigNumber;
  debt: ethers.BigNumber;
  price: ethers.BigNumber;
  liquidationPrice: ethers.BigNumber | null; // liquidated when 1 DT = X underlying
  strategy: LendingStrategy;
};

export async function getVaultInfo(
  id: ethers.BigNumber,
  strategyAddress: string,
  config: Config,
  signerOrProvider: ethers.Signer | ethers.providers.Provider,
): Promise<Vault> {
  const strategyContract = Strategy__factory.connect(
    strategyAddress,
    signerOrProvider,
  );
  const { debt, collateralValue } = await strategyContract.vaultInfo(
    id.toHexString(),
  );
  const strategy = await populateLendingStrategy(
    strategyAddress,
    config,
    signerOrProvider,
  );

  const maxLTV = strategy.maxLTVPercent;
  const maxUnderlying = collateralValue.mul(maxLTV).div(ONE);
  const liquidationPrice = debt.eq(0) ? null : maxUnderlying.div(debt);

  return {
    id,
    debt,
    price: collateralValue,
    liquidationPrice,
    strategy,
  };
}
