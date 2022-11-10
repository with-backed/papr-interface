import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { configs, SupportedToken, validateToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import { HeroesLandingPageContent } from 'components/LandingPageContent/PaprHeroes/HeroesLandingPageContent';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { calculateNetPhUSDCBalance } from 'lib/paprHeroes';
import { ethers } from 'ethers';

export const getServerSideProps: GetServerSideProps<
  HeroesLandingPageProps
> = async (context) => {
  try {
    validateToken(context.params!);
    const token = context.params?.token as SupportedToken;

    const oracleInfo = await getOracleInfoFromAllowedCollateral(
      configs[token].paprHeroesCollateral,
      token,
      true,
    );

    // TODO(adamgobes): figure out a way to get all participating players, probably from subgraph
    const participatingPlayers = ['0xE89CB2053A04Daf86ABaa1f4bC6D50744e57d39E'];

    const playerScores = await Promise.all(
      participatingPlayers.map(async (p) => [
        p,
        ethers.utils.formatUnits(
          await calculateNetPhUSDCBalance(p, oracleInfo),
          6,
        ),
      ]),
    );

    const rankedPlayers = playerScores.sort(
      (a, b) => parseInt(b[1]) - parseInt(a[1]),
    );

    return {
      props: {
        token,
        oracleInfo,
        rankedPlayers,
      },
    };
  } catch (e) {
    captureException(e);
    return {
      notFound: true,
    };
  }
};

type HeroesLandingPageProps = {
  token: SupportedToken;
  oracleInfo: { [key: string]: ReservoirResponseData };
  rankedPlayers: string[][];
};
export default function HeroesLandingPage({
  token,
  oracleInfo,
  rankedPlayers,
}: HeroesLandingPageProps) {
  return (
    <>
      <OpenGraph title={`Backed | Papr Heroes | Home`} />
      <HeroesLandingPageContent
        collateral={configs[token].paprHeroesCollateral}
        oracleInfo={oracleInfo}
        rankedPlayers={rankedPlayers}
      />
    </>
  );
}
