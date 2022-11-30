import { configs, getConfig, SupportedToken } from 'lib/config';
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
import { usePaprController } from 'hooks/usePaprController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useMemo } from 'react';
import { OpenGraph } from 'components/OpenGraph';

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
