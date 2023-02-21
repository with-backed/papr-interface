import { captureException } from '@sentry/nextjs';
import { OpenGraph } from 'components/OpenGraph';
import { ControllerContextProvider } from 'hooks/useController';
import { configs, getConfig, SupportedToken } from 'lib/config';
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
