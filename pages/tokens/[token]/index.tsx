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
import { usePaprController_deprecated } from 'hooks/usePaprController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useMemo } from 'react';
import { OpenGraph } from 'components/OpenGraph';
import { captureException } from '@sentry/nextjs';

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
  const paprController = usePaprController_deprecated({
    subgraphController,
    subgraphPool,
  });

  const pricesData = useAsyncValue(
    () =>
      controllerPricesData(
        paprController,
        config.tokenName as SupportedToken,
        config.uniswapSubgraph,
      ),
    [config, paprController],
  );

  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

  return (
    <OracleInfoProvider collections={collections}>
      <OpenGraph title={`${config.tokenName} | Performance`} />
      <ControllerOverviewContent
        paprController={paprController}
        pricesData={pricesData}
      />
    </OracleInfoProvider>
  );
}
