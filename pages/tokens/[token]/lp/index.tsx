import { LPPageContent } from 'components/Controllers/LPPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { useSubgraphData } from 'hooks/useSubgraphData';
import capitalize from 'lodash/capitalize';
import React from 'react';

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
