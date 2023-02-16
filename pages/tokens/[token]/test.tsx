import { TestPageContent } from 'components/Controllers/TestPageContent';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { ControllerContextProvider } from 'hooks/useController';
import { useSubgraphData } from 'hooks/useSubgraphData';
import { getConfig, SupportedToken } from 'lib/config';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.params?.token as SupportedToken;
  const address: string | undefined =
    getConfig(token)?.controllerAddress?.toLocaleLowerCase();
  if (!address) {
    return {
      notFound: true,
    };
  }

  return {
    props: {},
  };
};

export default function InKindTest() {
  const subgraphData = useSubgraphData();

  if (!subgraphData.subgraphController) {
    return <PageLevelStatusFieldsets {...subgraphData} />;
  }

  return (
    <ControllerContextProvider value={subgraphData.subgraphController}>
      <TestPageContent />
    </ControllerContextProvider>
  );
}
