import { ethers } from 'ethers';
import { Config, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { divide } from 'lodash';
import {
  ERC721,
  ERC721__factory,
  Strategy__factory,
} from 'types/generated/abis';
import { Chain, useSigner } from 'wagmi';
import { LendingStrategy, populateLendingStrategy } from '..';
import { ONE } from '../constants';

export type Vault = {
  contract: ERC721;
  id: ethers.BigNumber;
  owner: string;
  debt: ethers.BigNumber;
  price: ethers.BigNumber;
  liquidationPrice: ethers.BigNumber; // liquidated when 1 DT = X underlying
  strategy: LendingStrategy;
};

export async function getVaultInfo(
  id: ethers.BigNumber,
  strategyAddress: string,
  config: Config,
  signer: ethers.Signer,
): Promise<Vault> {
  const strategyContract = Strategy__factory.connect(strategyAddress, signer);
  const { debt, price } = await strategyContract.vaultInfo(id.toHexString());
  const strategy = await populateLendingStrategy(strategyAddress, config);

  const vaultContract = strategy.debtVault;
  const owner = await vaultContract.ownerOf(id);

  const maxLTV = strategy.maxLTV;
  const maxUnderlying = price.mul(maxLTV).div(ONE);
  const liquidationPrice = maxUnderlying.div(debt);

  return {
    contract: vaultContract,
    id: id,
    owner,
    debt,
    price,
    liquidationPrice: liquidationPrice,
    strategy: strategy,
  };
}
