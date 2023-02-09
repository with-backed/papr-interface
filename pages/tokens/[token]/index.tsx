import { captureException } from '@sentry/nextjs';
import {
  ControllerOverviewContent,
  ControllerPageProps,
} from 'components/Controllers/ControllerOverviewContent';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { configs, getConfig, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphController,
  SubgraphPool,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import { useMemo } from 'react';

type ServerSideProps = Omit<
  ControllerPageProps,
  'paprController' | 'pricesData'
> & {
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const token = context.params?.token as SupportedToken;
  const address: string | undefined =
    getConfig(token)?.controllerAddress?.toLocaleLowerCase();
  if (!address) {
    return {
      notFound: true,
    };
  }

  const controllerSubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
    token,
  );

  if (!controllerSubgraphData) {
    const e = new Error(`subgraph data for controller ${address} not found`);
    captureException(e);
    throw e;
  }

  const { pool, paprController } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
      subgraphPool: pool,
    },
  };
};

export default function ControllerPage({
  subgraphController,
  subgraphPool,
}: ServerSideProps) {
  const config = useConfig();

  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphController}>
        <OpenGraph title={`${config.tokenName} | Performance`} />
        <ControllerOverviewContent subgraphPool={subgraphPool} />
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
