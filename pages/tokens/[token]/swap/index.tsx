import { captureException } from '@sentry/nextjs';
import { OpenGraph } from 'components/OpenGraph';
import { ControllerContextProvider } from 'hooks/useController';
import { MarketPriceProvider } from 'hooks/useLatestMarketPrice';
import { configProxy, SupportedToken } from 'lib/config';
import { fetchSubgraphData, SubgraphController } from 'lib/PaprController';
import capitalize from 'lodash/capitalize';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

const SwapPageContent = dynamic(
  () => import('components/SwapPageContent').then((mod) => mod.SwapPageContent),
  {},
);

export const getServerSideProps: GetServerSideProps<SwapProps> = async (
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
      token: config.tokenName as SupportedToken,
    },
  };
};

type SwapProps = {
  token: SupportedToken;
  subgraphController: SubgraphController;
};
export default function Swap({ subgraphController, token }: SwapProps) {
  return (
    <ControllerContextProvider value={subgraphController}>
      <MarketPriceProvider>
        <OpenGraph title={`Backed | ${capitalize(token)} | Swap`} />
        <SwapPageContent />
      </MarketPriceProvider>
    </ControllerContextProvider>
  );
}
