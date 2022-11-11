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
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/controllers';
import { usePaprController } from 'hooks/usePaprController';

type ServerSideProps = Omit<
  ControllerPageProps,
  'paprController' | 'pricesData'
> & {
  subgraphController: SubgraphController;
  oracleInfo: { [key: string]: ReservoirResponseData };
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

  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    paprController.allowedCollateral.map((ac) => ac.contractAddress),
    token,
  );

  return {
    props: {
      address: address,
      subgraphController: paprController,
      oracleInfo,
      subgraphPool: pool,
    },
  };
};

export default function ControllerPage({
  address,
  subgraphController,
  oracleInfo,
  subgraphPool,
}: ServerSideProps) {
  const config = useConfig();
  const paprController = usePaprController({
    subgraphController,
    subgraphPool,
    oracleInfo,
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
    <ControllerOverviewContent
      address={address}
      paprController={paprController}
      pricesData={pricesData}
    />
  );
}
