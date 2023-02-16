import { ControllerOverviewContent } from 'components/Controllers/ControllerOverviewContent';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useEffect, useMemo } from 'react';
import {
  PaprControllerByIdDocument,
  PaprControllerByIdQuery,
} from 'types/generated/graphql/inKindSubgraph';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export default function ControllerPage() {
  const config = useConfig();

  const [
    {
      data: controllerQueryData,
      fetching: controllerQueryFetching,
      error: controllerQueryError,
    },
  ] = useQuery<PaprControllerByIdQuery>({
    query: PaprControllerByIdDocument,
    variables: { id: config.controllerAddress },
  });

  const [{ data: poolData, fetching: poolFetching, error: poolError }] =
    useQuery<PoolByIdQuery>({
      query: PoolByIdDocument,
      variables: { id: config.uniswapPoolAddress },
      context: useMemo(
        () => ({
          url: config.uniswapSubgraph,
        }),
        [config.uniswapSubgraph],
      ),
    });

  useEffect(() => {
    if (poolError) {
      console.log({ poolError });
    }
    if (controllerQueryError) {
      console.log({ controllerQueryError });
    }
  });

  const collections = useMemo(() => {
    if (controllerQueryData?.paprController) {
      return controllerQueryData.paprController.allowedCollateral.map(
        (c) => c.id,
      );
    }
    return null;
  }, [controllerQueryData]);

  if (controllerQueryFetching || poolFetching) {
    return 'loading...';
  }

  if (!controllerQueryData?.paprController || !poolData?.pool || !collections) {
    return ':c';
  }

  console.log(controllerQueryData.paprController.poolAddress);
  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={controllerQueryData.paprController}>
        <OpenGraph title={`${config.tokenName} | Performance`} />
        <ControllerOverviewContent subgraphPool={poolData.pool} />
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
