import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { configs, SupportedNetwork, validateNetwork } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import { HeroesLandingPageContent } from 'components/LandingPageContent/HeroesLandingPageContent';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { calculateNetPhUSDCBalance } from 'lib/paprHeroes';
import { ethers } from 'ethers';

export const getServerSideProps: GetServerSideProps<
  HeroesLandingPageProps
> = async (context) => {
  try {
    validateNetwork(context.params!);
    const network = context.params?.network as SupportedNetwork;

    const oracleInfo = await getOracleInfoFromAllowedCollateral(
      configs[network].paprHeroesCollateral,
      network,
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
        network,
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
  network: SupportedNetwork;
  oracleInfo: { [key: string]: ReservoirResponseData };
  rankedPlayers: string[][];
};
export default function HeroesLandingPage({
  network,
  oracleInfo,
  rankedPlayers,
}: HeroesLandingPageProps) {
  return (
    <>
      <OpenGraph title={`Backed | Papr Heroes | Home`} />
      <HeroesLandingPageContent
        collateral={configs[network].paprHeroesCollateral}
        oracleInfo={oracleInfo}
        rankedPlayers={rankedPlayers}
      />
    </>
  );
}
