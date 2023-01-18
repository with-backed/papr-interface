import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedToken, validateToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';
import { LPPageContent } from 'components/Controllers/LPPageContent';

export const getServerSideProps: GetServerSideProps<LPProps> = async (
  context,
) => {
  try {
    validateToken(context.params || {});
    const network = context.params?.token as SupportedToken;

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
  network: SupportedToken;
};
export default function LP({ network }: LPProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(network)} | LP`} />
      <LPPageContent />
    </>
  );
}
