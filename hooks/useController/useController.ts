import { captureException } from '@sentry/nextjs';
import { useConfig } from 'hooks/useConfig';
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

interface PaprController {
  paprToken: ERC20Token;
  underlying: ERC20Token;
  allowedCollateral: AllowedCollateral[];
  target: number;
  token0IsUnderlying: boolean;
  poolAddress: string;
}

type UseControllerResult = {
  controller: PaprController | null;
  fetching: boolean;
};

export function useController(): UseControllerResult {
  const { controllerAddress } = useConfig();

  const [{ data, fetching, error }] = useQuery<UseControllerQuery>({
    query: UseControllerDocument,
    variables: {
      id: controllerAddress,
    },
  });

  useEffect(() => {
    if (error) {
      captureException(error);
    }
  }, [error]);

  return {
    fetching,
    controller: data?.paprController ?? null,
  };
}
