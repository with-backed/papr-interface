import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedNetwork, validateNetwork } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';

export const getServerSideProps: GetServerSideProps<LPProps> = async (
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

type LPProps = {
  network: SupportedNetwork;
};
export default function LP({ network }: LPProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(network)} | LP`} />
      <h1>under construction</h1>
    </>
  );
}
