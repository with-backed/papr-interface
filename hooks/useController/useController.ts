import { captureException } from '@sentry/nextjs';
import { useConfig } from 'hooks/useConfig';
import { createGenericContext } from 'lib/createGenericContext';
import { useEffect } from 'react';
import {
  UseControllerDocument,
  UseControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

interface ERC20Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface AllowedCollateral {
  id: string;
  token: { name: string; symbol: string };
  allowed: boolean;
}

export interface PaprController {
  paprToken: ERC20Token;
  underlying: ERC20Token;
  allowedCollateral: AllowedCollateral[];
  target: number;
  token0IsUnderlying: boolean;
  poolAddress: string;
}

const [useControllerContext, ControllerContextProvider] =
  createGenericContext<PaprController>();

function useController(): PaprController {
  const controller = useControllerContext();
  return controller;
}

export { useController, ControllerContextProvider };
