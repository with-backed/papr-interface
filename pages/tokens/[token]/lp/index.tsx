import { captureException } from '@sentry/nextjs';
import { LPPageContent } from 'components/Controllers/LPPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { configs, getConfig, SupportedToken } from 'lib/config';
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
    },
  };
};

export default function LP({ subgraphController }: ServerSideProps) {
  const { network } = useConfig();
  return (
    <ControllerContextProvider value={subgraphController}>
      <OpenGraph title={`Backed | ${capitalize(network)} | LP`} />
      <LPPageContent />
    </ControllerContextProvider>
  );
}
