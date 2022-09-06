import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { ERC721, Strategy__factory } from 'types/generated/abis';
import { LendingStrategy, populateLendingStrategy } from '..';
import { ONE } from '../constants';

export type Vault = {
  id: ethers.BigNumber;
  debt: ethers.BigNumber;
  price: ethers.BigNumber;
  liquidationPrice: ethers.BigNumber; // liquidated when 1 DT = X underlying
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
  const { debt, price } = await strategyContract.vaultInfo(id.toHexString());
  const strategy = await populateLendingStrategy(
    strategyAddress,
    config,
    signerOrProvider,
  );

  const maxLTV = strategy.maxLTV;
  const maxUnderlying = price.mul(maxLTV).div(ONE);
  // TODO: how should we represent this when debt is zero?
  const liquidationPrice = debt.eq(0) ? debt : maxUnderlying.div(debt);

  return {
    id,
    debt,
    price,
    liquidationPrice,
    strategy,
  };
}
