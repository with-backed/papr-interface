import { BigNumberish } from 'ethers';
import { createGenericContext } from 'lib/createGenericContext';

interface ERC20Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface AllowedCollateral {
  id: string;
  token: { id: string; name: string; symbol: string };
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
}

const [useControllerContext, ControllerContextProvider] =
  createGenericContext<PaprController>();

function useController(): PaprController {
  const controller = useControllerContext();
  return controller;
}

export { useController, ControllerContextProvider };
