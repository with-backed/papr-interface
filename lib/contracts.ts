import { ethers } from 'ethers';
import {
  ERC20__factory,
  ERC721__factory,
  IQuoter__factory,
  PaprController__factory,
} from 'types/generated/abis';

import { configs, SupportedToken } from './config';

export function makeProvider(jsonRpcProvider: string, token: SupportedToken) {
  return new ethers.providers.JsonRpcProvider(
    jsonRpcProvider,
    configs[token].chainId,
  );
}

export function erc20Contract(address: string, token: SupportedToken) {
  const provider = makeProvider(configs[token].jsonRpcProvider, token);
  return ERC20__factory.connect(address, provider);
}

export function erc721Contract(
  address: string,
  provider: ethers.providers.Provider | ethers.Signer,
) {
  return ERC721__factory.connect(address, provider);
}

////// controller code /////
export function jsonRpcControllerContract(
  address: string,
  token: SupportedToken,
) {
  const provider = makeProvider(configs[token].jsonRpcProvider, token);
  return PaprController__factory.connect(address, provider);
}

export function Quoter(jsonRpcProvider: string, token: SupportedToken) {
  const provider = makeProvider(jsonRpcProvider, token);
  return IQuoter__factory.connect(
    process.env.NEXT_PUBLIC_QUOTER as string,
    provider,
  );
}
