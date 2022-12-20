import { TestPageContent } from 'components/Controllers/TestPageContent';
import { configs, getConfig, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import { usePaprController } from 'hooks/usePaprController';
import { captureException } from '@sentry/nextjs';

export type TestProps = {
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<TestProps> = async (
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
      subgraphController: paprController,
      subgraphPool: pool,
    },
  };
};

export default function InKindTest({
  subgraphPool,
  subgraphController,
}: TestProps) {
  const paprController = usePaprController({
    subgraphController,
    subgraphPool,
  });

  return <TestPageContent paprController={paprController} />;
}
