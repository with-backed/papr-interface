import { ethers, Signer } from 'ethers';
import {
  ERC20__factory,
  ERC721,
  ERC721__factory,
  IQuoter__factory,
  Strategy__factory,
} from 'types/generated/abis';
import { configs, SupportedNetwork } from './config';

export function makeProvider(
  jsonRpcProvider: string,
  network: SupportedNetwork,
) {
  return new ethers.providers.JsonRpcProvider(
    jsonRpcProvider,
    configs[network].chainId,
  );
}

export function web3Erc20Contract(address: string, signer: Signer) {
  return erc20Contract(address, signer);
}

export function web3Erc721Contract(address: string, signer: Signer) {
  return erc721Contract(address, signer);
}

export function jsonRpcERC721Contract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedNetwork,
): ERC721 {
  const provider = makeProvider(jsonRpcProvider, network);
  return erc721Contract(address, provider);
}

export function jsonRpcERC20Contract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedNetwork,
) {
  const provider = makeProvider(jsonRpcProvider, network);
  return erc20Contract(address, provider);
}

export function erc20Contract(
  address: string,
  provider: ethers.providers.Provider | ethers.Signer,
) {
  return ERC20__factory.connect(address, provider);
}

export function erc721Contract(
  address: string,
  provider: ethers.providers.Provider | ethers.Signer,
) {
  return ERC721__factory.connect(address, provider);
}

////// strategy code /////

export function jsonRpcStrategyContract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedNetwork,
) {
  const provider = makeProvider(jsonRpcProvider, network);
  return Strategy__factory.connect(address, provider);
}

export function Quoter(jsonRpcProvider: string, network: SupportedNetwork) {
  const provider = makeProvider(jsonRpcProvider, network);
  return IQuoter__factory.connect(
    process.env.NEXT_PUBLIC_QUOTER as string,
    provider,
  );
}

export function strategyContract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedNetwork,
) {
  const provider = makeProvider(jsonRpcProvider, network);
  return Strategy__factory.connect(address, provider);
}
