import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { SupportedToken, validateToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import capitalize from 'lodash/capitalize';
import { LandingPageContent } from 'components/LandingPageContent/MainLandingPage';

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  context,
) => {
  try {
    validateToken(context.params!);
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

type HomeProps = {
  token: SupportedToken;
};
export default function Home({ token }: HomeProps) {
  return (
    <>
      <OpenGraph title={`Backed | ${capitalize(token)} | Home`} />
      <LandingPageContent />
    </>
  );
}
