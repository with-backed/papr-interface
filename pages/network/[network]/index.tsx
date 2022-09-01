import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedNetwork, validateNetwork } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import { BUNNY_IMG_URL_MAP } from 'lib/constants';
import capitalize from 'lodash/capitalize';

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
      <OpenGraph
        title={`Backed | ${capitalize(network)} | Home`}
        description="Welcome to Backed protocol - NFT Lending. View existing loans, lend against NFTs, or propose loan terms on your own NFTs."
        imageUrl={BUNNY_IMG_URL_MAP[network]}
      />
      <h1>under construction</h1>
    </>
  );
}
