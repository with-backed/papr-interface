import { useConfig } from 'hooks/useConfig';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useMemo } from 'react';
import {
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { ReservoirResponseData } from 'lib/oracle/reservoir';

type UseLendingStrategyParams = {
  subgraphStrategy: SubgraphStrategy;
  subgraphPool: SubgraphPool;
  oracleInfo: { [key: string]: ReservoirResponseData };
};

export function useLendingStrategy({
  subgraphStrategy,
  subgraphPool,
  oracleInfo,
}: UseLendingStrategyParams) {
  const config = useConfig();
  const signerOrProvider = useSignerOrProvider();

  const lendingStrategy = useMemo(() => {
    return makeLendingStrategy(
      subgraphStrategy,
      subgraphPool,
      oracleInfo,
      signerOrProvider,
      config,
    );
  }, [config, signerOrProvider, subgraphPool, oracleInfo, subgraphStrategy]);

  return lendingStrategy;
}
