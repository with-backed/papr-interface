import { useConfig } from 'hooks/useConfig';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useMemo } from 'react';
import {
  makePaprController,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';

type UsePaprControllerParams = {
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
};

export function usePaprController({
  subgraphController,
  subgraphPool,
}: UsePaprControllerParams) {
  const config = useConfig();
  const signerOrProvider = useSignerOrProvider();

  const paprController = useMemo(() => {
    return makePaprController(
      subgraphController,
      subgraphPool,
      signerOrProvider,
      config,
    );
  }, [config, signerOrProvider, subgraphPool, subgraphController]);

  return paprController;
}
