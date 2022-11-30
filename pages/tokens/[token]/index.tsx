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
import { usePaprController } from 'hooks/usePaprController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useMemo } from 'react';
import { OpenGraph } from 'components/OpenGraph';

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
  const address = getConfig(token).controllerAddress.toLocaleLowerCase();

  const controllerSubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
    token,
  );

  if (!controllerSubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, paprController } = controllerSubgraphData;

  return {
    props: {
      address: address,
      subgraphController: paprController,
      subgraphPool: pool,
    },
  };
};

export default function ControllerPage({
  address,
  subgraphController,
  subgraphPool,
}: ServerSideProps) {
  const config = useConfig();
  const paprController = usePaprController({
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
    () => subgraphController.allowedCollateral.map((c) => c.contractAddress),
    [subgraphController.allowedCollateral],
  );

  return (
    <OracleInfoProvider collections={collections}>
      <OpenGraph title={`${config.tokenName} | Performance`} />
      <ControllerOverviewContent
        address={address}
        paprController={paprController}
        pricesData={pricesData}
      />
    </OracleInfoProvider>
  );
}
