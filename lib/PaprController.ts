import { PaprControllerByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';

import { SupportedToken } from './config';
import { subgraphControllerByAddress } from './pAPRSubgraph';
import { subgraphUniswapPoolById } from './uniswapSubgraph';

/**
 * TODO: we should unify on the return type from `useController`
 */
export type SubgraphController = NonNullable<
  PaprControllerByIdQuery['paprController']
>;
export type SubgraphPool = NonNullable<PoolByIdQuery['pool']>;

/**
 * Returns an object containing the subgraph data required to instantiate
 * PaprController, or returns null if any subgraph data is not found.
 *
 * TODO: fallback to node?
 */
export async function fetchSubgraphData(
  controllerAddress: string,
  uniswapSubgraphUrl: string,
  token: SupportedToken,
) {
  const subgraphController = await subgraphControllerByAddress(
    controllerAddress,
    token,
  );

  if (!subgraphController?.paprController) {
    return null;
  }

  const subgraphPool = await subgraphUniswapPoolById(
    subgraphController.paprController.poolAddress,
    uniswapSubgraphUrl,
  );

  if (!subgraphPool?.pool) {
    return null;
  }

  return {
    paprController: subgraphController.paprController,
    pool: subgraphPool.pool,
  };
}
