import { useConfig } from 'hooks/useConfig';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useMemo } from 'react';
import {
  makePaprController,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { ReservoirResponseData } from 'lib/oracle/reservoir';

type UsePaprControllerParams = {
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
  oracleInfo: { [key: string]: ReservoirResponseData };
};

export function usePaprController({
  subgraphController,
  subgraphPool,
  oracleInfo,
}: UsePaprControllerParams) {
  const config = useConfig();
  const signerOrProvider = useSignerOrProvider();

  const paprController = useMemo(() => {
    return makePaprController(
      subgraphController,
      subgraphPool,
      oracleInfo,
      signerOrProvider,
      config,
    );
  }, [config, signerOrProvider, subgraphPool, oracleInfo, subgraphController]);

  return paprController;
}
