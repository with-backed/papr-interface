import { ethers } from 'ethers';
import { Config, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { divide } from 'lodash';
import {
  ERC721,
  ERC721__factory,
  Strategy__factory,
} from 'types/generated/abis';
import { Chain } from 'wagmi';

export type Vault = {
  contract: ERC721;
  id: ethers.BigNumber;
  owner: string;
  debt: ethers.BigNumber;
  price: ethers.BigNumber;
  liquidationPrice: ethers.BigNumber; // liquidated when 1 DT = X underlying
};

export async function getVaultInfo(
  id: ethers.BigNumber,
  strategyAddress: string,
  config: Config,
): Promise<Vault> {
  const provider = makeProvider(
    config.jsonRpcProvider,
    config.network as SupportedNetwork,
  );
  const strategy = Strategy__factory.connect(strategyAddress, provider);
  const { debt, price } = await strategy.vaultInfo(id.toHexString());

  const vaultContract = ERC721__factory.connect(
    await strategy.debtVault(),
    provider,
  );
  const owner = await vaultContract.ownerOf(id);

  const ONE = ethers.BigNumber.from(10).pow(18);
  const maxLTV = ONE.div(2); // 50%, should be fetched from contract in future
  const maxUnderlying = price.mul(maxLTV).div(ONE);
  const liquidationPrice = maxUnderlying.div(debt);

  return {
    contract: vaultContract,
    id: id,
    owner,
    debt,
    price,
    liquidationPrice: liquidationPrice,
  };
}
