import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { configs, getConfig, SupportedToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';
import { SwapPageContent } from 'components/SwapPageContent';
import { fetchSubgraphData, SubgraphController } from 'lib/PaprController';
import { ControllerContextProvider } from 'hooks/useController';

export const getServerSideProps: GetServerSideProps<SwapProps> = async (
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

  const { paprController } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
      token,
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
      <OpenGraph title={`Backed | ${capitalize(token)} | Swap`} />
      <SwapPageContent />
    </ControllerContextProvider>
  );
}
