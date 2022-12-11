import { captureException } from '@sentry/nextjs';
import { OpenGraph } from 'components/OpenGraph';
import { SupportedToken, validateToken } from 'lib/config';
import capitalize from 'lodash/capitalize';
import { GetServerSideProps } from 'next';
import React from 'react';

export const getServerSideProps: GetServerSideProps<SwapProps> = async (
  context,
) => {
  try {
    if (!context.params) throw new Error('missing params');
    validateToken(context.params);
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
      <h1>under construction</h1>
    </>
  );
}
