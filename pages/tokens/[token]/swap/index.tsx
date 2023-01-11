import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedToken, validateToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';
import { SwapPageContent } from 'components/SwapPageContent';

export const getServerSideProps: GetServerSideProps<SwapProps> = async (
  context,
) => {
  try {
    validateToken(context.params || {});
    const token = context.params?.token as SupportedToken;

    return {
      props: {
        token,
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
  token: SupportedToken;
};
export default function Swap({ token }: SwapProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(token)} | Swap`} />
      <SwapPageContent />
    </>
  );
}
