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
import { usePaprController_deprecated } from 'hooks/usePaprController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useMemo } from 'react';
import { OpenGraph } from 'components/OpenGraph';
import { captureException } from '@sentry/nextjs';
import { ControllerContextProvider } from 'hooks/useController';

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
      <ControllerContextProvider value={subgraphController}>
        <OpenGraph title={`${config.tokenName} | Borrow`} />
        <BorrowPageContent
          paprController={paprController}
          controllerAddress={controllerAddress}
          pricesData={pricesData}
        />
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
