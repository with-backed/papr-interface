import { ControllerOverviewContent } from 'components/Controllers/ControllerOverviewContent';
import { OpenGraph } from 'components/OpenGraph';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useSubgraphData } from 'hooks/useSubgraphData';
import { getConfig, SupportedToken } from 'lib/config';
import { GetServerSideProps } from 'next';
import { useMemo } from 'react';

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

export default function ControllerPage() {
  const config = useConfig();
  const subgraphData = useSubgraphData();

  const collections = useMemo(
    () =>
      subgraphData.subgraphController
        ? subgraphData.subgraphController.allowedCollateral.map(
            (c) => c.token.id,
          )
        : [],
    [subgraphData.subgraphController],
  );

  if (!subgraphData.subgraphController || !subgraphData.subgraphPool) {
    return <PageLevelStatusFieldsets {...subgraphData} />;
  }

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphData.subgraphController}>
        <OpenGraph title={`${config.tokenName} | Performance`} />
        <ControllerOverviewContent subgraphPool={subgraphData.subgraphPool} />
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
