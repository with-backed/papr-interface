import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedNetwork, validateNetwork } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';
import { LandingPageContent } from 'components/LandingPageContent';

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
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

type HomeProps = {
  network: SupportedNetwork;
};
export default function Home({ network }: HomeProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(network)} | Home`} />
      <LandingPageContent />
    </>
  );
}
