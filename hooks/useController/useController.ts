import { BigNumberish } from 'ethers';
import { createGenericContext } from 'lib/createGenericContext';

interface ERC20Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface ERC721Token {
  id: string;
  name: string;
  symbol: string;
}

interface AllowedCollateral {
  id: string;
  token: ERC721Token;
  allowed: boolean;
}

export interface PaprController {
  id: string;
  paprToken: ERC20Token;
  underlying: ERC20Token;
  allowedCollateral: AllowedCollateral[];
  token0IsUnderlying: boolean;
  poolAddress: string;
  maxLTV: BigNumberish;
  fundingPeriod: BigNumberish;
  currentTarget: BigNumberish;
  currentTargetUpdated: number;
  vaults?:
    | {
        id: string;
        token: ERC721Token;
        debt: BigNumberish;
        collateralCount: number;
        account: string;
        collateral:
          | {
              id: string;
              tokenId: string;
            }[];
      }[]
    | null
    | undefined;
}

const [useControllerContext, ControllerContextProvider] =
  createGenericContext<PaprController>();

function useController(): PaprController {
  const controller = useControllerContext();
  return controller;
}

export { ControllerContextProvider, useController };
