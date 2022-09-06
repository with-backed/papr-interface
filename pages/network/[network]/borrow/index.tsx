import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedNetwork, validateNetwork } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';

export const getServerSideProps: GetServerSideProps<BorrowProps> = async (
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

type BorrowProps = {
  network: SupportedNetwork;
};
export default function Borrow({ network }: BorrowProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(network)} | Borrow`} />
      <h1>under construction</h1>
    </>
  );
}
