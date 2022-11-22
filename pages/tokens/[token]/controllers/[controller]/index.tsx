import { GetServerSideProps } from 'next';
import { controllerPricesData } from 'lib/controllers/charts';
import { configs, SupportedToken } from 'lib/config';
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
  const address = (context.params?.controller as string).toLowerCase();
  const token = context.params?.token as SupportedToken;

  const controllerSubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
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

  return (
    <OracleInfoProvider
      collections={subgraphController.allowedCollateral.map(
        (c) => c.contractAddress,
      )}>
      <ControllerOverviewContent
        address={address}
        paprController={paprController}
        pricesData={pricesData}
      />
    </OracleInfoProvider>
  );
}
