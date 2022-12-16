import {
  BorrowPageContent,
  BorrowPageProps,
} from 'components/Controllers/BorrowPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { usePaprController } from 'hooks/usePaprController';
import { configs, getConfig, SupportedToken } from 'lib/config';
import { controllerPricesData } from 'lib/controllers/charts';
import {
  fetchSubgraphData,
  SubgraphController,
  SubgraphPool,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import { useMemo } from 'react';

type ServerSideProps = Omit<
  BorrowPageProps,
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
      controllerAddress: address,
      subgraphController: paprController,
      subgraphPool: pool,
    },
  };
};

export default function Borrow({
  controllerAddress,
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
      <OpenGraph title={`${config.tokenName} | Borrow`} />
      <BorrowPageContent
        paprController={paprController}
        controllerAddress={controllerAddress}
        pricesData={pricesData}
      />
    </OracleInfoProvider>
  );
}
