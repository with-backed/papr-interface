import { ethers, Signer } from 'ethers';
import {
  ERC20__factory,
  ERC721,
  ERC721__factory,
  IQuoter__factory,
  Controller__factory,
} from 'types/generated/abis';
import { configs, SupportedToken } from './config';

export function makeProvider(jsonRpcProvider: string, token: SupportedToken) {
  return new ethers.providers.JsonRpcProvider(
    jsonRpcProvider,
    configs[token].chainId,
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
  network: SupportedToken,
): ERC721 {
  const provider = makeProvider(jsonRpcProvider, network);
  return erc721Contract(address, provider);
}

export function jsonRpcERC20Contract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedToken,
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

////// controller code /////

export function jsonRpcControllerContract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedToken,
) {
  const provider = makeProvider(jsonRpcProvider, network);
  return Controller__factory.connect(address, provider);
}

export function Quoter(jsonRpcProvider: string, token: SupportedToken) {
  const provider = makeProvider(jsonRpcProvider, token);
  return IQuoter__factory.connect(
    process.env.NEXT_PUBLIC_QUOTER as string,
    provider,
  );
}

export function controllerContract(
  address: string,
  jsonRpcProvider: string,
  network: SupportedToken,
) {
  const provider = makeProvider(jsonRpcProvider, network);
  return Controller__factory.connect(address, provider);
}
