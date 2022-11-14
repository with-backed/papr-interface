import { configs, SupportedToken } from 'lib/config';
import { controllerPricesData } from 'lib/controllers/charts';
import { GetServerSideProps } from 'next';
import {
  BorrowPageContent,
  BorrowPageProps,
} from 'components/Controllers/BorrowPageContent';
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
  BorrowPageProps,
  'paprController' | 'pricesData'
> & {
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
  oracleInfo: { [key: string]: ReservoirResponseData };
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
      controllerAddress: address,
      subgraphController: paprController,
      subgraphPool: pool,
      oracleInfo: oracleInfo,
    },
  };
};

export default function Borrow({
  controllerAddress,
  subgraphController,
  subgraphPool,
  oracleInfo,
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
    <BorrowPageContent
      paprController={paprController}
      controllerAddress={controllerAddress}
      pricesData={pricesData}
      oracleInfo={oracleInfo}
    />
  );
}
