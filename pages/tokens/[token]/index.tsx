import { GetServerSideProps } from 'next';
import { controllerPricesData } from 'lib/controllers/charts';
import { configs, getConfig, SupportedToken } from 'lib/config';
import {
  ControllerOverviewContent,
  ControllerPageProps,
} from 'components/Controllers/ControllerOverviewContent';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { useConfig } from 'hooks/useConfig';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useMemo } from 'react';
import { OpenGraph } from 'components/OpenGraph';
import { captureException } from '@sentry/nextjs';
import { ControllerContextProvider } from 'hooks/useController';

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

  const pricesData = useAsyncValue(
    () =>
      controllerPricesData(
        subgraphController,
        config.tokenName as SupportedToken,
        config.uniswapSubgraph,
      ),
    [config, subgraphController],
  );

  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphController}>
        <OpenGraph title={`${config.tokenName} | Performance`} />
        <ControllerOverviewContent
          pricesData={pricesData}
          subgraphPool={subgraphPool}
        />
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
