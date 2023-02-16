import { OpenGraph } from 'components/OpenGraph';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { ControllerContextProvider } from 'hooks/useController';
import { useSubgraphData } from 'hooks/useSubgraphData';
import { getConfig, SupportedToken } from 'lib/config';
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

  return {
    props: {
      token,
    },
  };
};

type SwapProps = {
  token: SupportedToken;
};

export default function Swap({ token }: SwapProps) {
  const subgraphData = useSubgraphData();

  if (!subgraphData.subgraphController || !subgraphData.subgraphPool) {
    return <PageLevelStatusFieldsets {...subgraphData} />;
  }
  return (
    <ControllerContextProvider value={subgraphData.subgraphController}>
      <OpenGraph title={`Backed | ${capitalize(token)} | Swap`} />
      <SwapPageContent />
    </ControllerContextProvider>
  );
}
