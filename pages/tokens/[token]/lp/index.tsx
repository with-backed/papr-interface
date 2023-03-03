import { captureException } from '@sentry/nextjs';
import { LPPageContent } from 'components/Controllers/LPPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { MarketPriceProvider } from 'hooks/useLatestMarketPrice';
import { configProxy, SupportedToken } from 'lib/config';
import { fetchSubgraphData, SubgraphController } from 'lib/PaprController';
import capitalize from 'lodash/capitalize';
import { GetServerSideProps } from 'next';
import React from 'react';

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

  const { paprController } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
    },
  };
};

export default function LP({ subgraphController }: ServerSideProps) {
  const { network } = useConfig();
  return (
    <ControllerContextProvider value={subgraphController}>
      <MarketPriceProvider>
        <OpenGraph title={`Backed | ${capitalize(network)} | LP`} />
        <LPPageContent />
      </MarketPriceProvider>
    </ControllerContextProvider>
  );
}
