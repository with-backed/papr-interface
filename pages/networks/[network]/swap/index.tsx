import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedNetwork, validateNetwork } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';

export const getServerSideProps: GetServerSideProps<SwapProps> = async (
  context,
) => {
  try {
    validateNetwork(context.params!);
    const network = context.params?.network as SupportedNetwork;

    return {
      props: {
        network,
      },
    };
  } catch (e) {
    captureException(e);
    return {
      notFound: true,
    };
  }
};

type SwapProps = {
  network: SupportedNetwork;
};
export default function Swap({ network }: SwapProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(network)} | Swap`} />
      <h1>under construction</h1>
    </>
  );
}
