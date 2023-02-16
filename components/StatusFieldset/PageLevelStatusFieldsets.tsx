import { useSubgraphData } from 'hooks/useSubgraphData';
import { FunctionComponent } from 'react';

import { StatusFieldset } from './StatusFieldset';

export const PageLevelStatusFieldsets: FunctionComponent<
  ReturnType<typeof useSubgraphData>
> = ({
  subgraphController,
  subgraphControllerFetching,
  subgraphPool,
  subgraphPoolFetching,
}) => {
  if (!subgraphController && subgraphControllerFetching) {
    return (
      <StatusFieldset kind="loading">
        Fetching controller data...
      </StatusFieldset>
    );
  }

  if (!subgraphController) {
    return (
      <StatusFieldset kind="error">
        Error loading controller data.
      </StatusFieldset>
    );
  }

  if (!subgraphPool && subgraphPoolFetching) {
    return (
      <StatusFieldset kind="loading">
        Fetching Uniswap pool data...
      </StatusFieldset>
    );
  }

  if (!subgraphPool) {
    return (
      <StatusFieldset kind="error">
        Error loading Uniswap pool data.
      </StatusFieldset>
    );
  }

  return null;
};
