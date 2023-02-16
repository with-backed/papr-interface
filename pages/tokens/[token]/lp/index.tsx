import { LPPageContent } from 'components/Controllers/LPPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { useSubgraphData } from 'hooks/useSubgraphData';
import { getConfig, SupportedToken } from 'lib/config';
import capitalize from 'lodash/capitalize';
import { GetServerSideProps } from 'next';
import React from 'react';

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

export default function LP() {
  const { network } = useConfig();
  const subgraphData = useSubgraphData();

  if (!subgraphData.subgraphController) {
    return <PageLevelStatusFieldsets {...subgraphData} />;
  }

  return (
    <ControllerContextProvider value={subgraphData.subgraphController}>
      <OpenGraph title={`Backed | ${capitalize(network)} | LP`} />
      <LPPageContent />
    </ControllerContextProvider>
  );
}
