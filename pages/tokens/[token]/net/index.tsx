import { captureException } from '@sentry/nextjs';
import { SwapPositionsPageContent } from 'components/Controllers/SwapPositionsPageContent/SwapPositionsPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { MarketPriceProvider } from 'hooks/useLatestMarketPrice';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { configProxy, SupportedToken } from 'lib/config';
import { fetchSubgraphData, SubgraphController } from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import { useMemo } from 'react';

type ServerSideProps = {
  subgraphController: SubgraphController;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const token = context.params?.token as string;
  const config = configProxy[token];
  if (!config) {
    return {
      notFound: true,
    };
  }

  const controllerSubgraphData = await fetchSubgraphData(
    config.controllerAddress.toLocaleLowerCase(),
    config.uniswapSubgraph,
    config.tokenName as SupportedToken,
  );

  if (!controllerSubgraphData) {
    const e = new Error(
      `subgraph data for controller ${config.controllerAddress} not found`,
    );
    captureException(e);
    throw e;
  }

  const { pool, paprController } = controllerSubgraphData;

  return {
    props: {
      controllerAddress: config.controllerAddress,
      subgraphController: paprController,
    },
  };
};

export default function Net({ subgraphController }: ServerSideProps) {
  const config = useConfig();

  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphController}>
        <MarketPriceProvider>
          <OpenGraph title={`${config.tokenName} | Swap Positions`} />
          <SwapPositionsPageContent />
        </MarketPriceProvider>
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
