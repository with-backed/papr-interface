import { captureException } from '@sentry/nextjs';
import { TestPageContent } from 'components/Controllers/TestPageContent';
import { ControllerContextProvider, PaprController } from 'hooks/useController';
import { configs, getConfig, SupportedToken } from 'lib/config';
import { fetchSubgraphData } from 'lib/PaprController';
import { GetServerSideProps } from 'next';

export type TestProps = {
  subgraphController: PaprController;
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

  const { paprController } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
    },
  };
};

export default function InKindTest({ subgraphController }: TestProps) {
  return (
    <ControllerContextProvider value={subgraphController}>
      <TestPageContent />
    </ControllerContextProvider>
  );
}
