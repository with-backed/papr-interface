import { captureException } from '@sentry/nextjs';
import { HeroesLandingPageContent } from 'components/LandingPageContent/PaprHeroes/HeroesLandingPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { configs, SupportedToken, validateToken } from 'lib/config';
import {
  getOracleInfoFromAllowedCollateral,
  getQuoteForSwap,
} from 'lib/controllers';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { fetchSubgraphData } from 'lib/PaprController';
import { calculateNetPhUSDCBalance, HeroPlayerBalance } from 'lib/paprHeroes';
import { getAllPaprHeroPlayers } from 'lib/pAPRSubgraph';
import { GetServerSideProps } from 'next';
import React from 'react';

const DO_NOT_SHOW_THESE_ADDRESSES_ON_LEADERBOARD: Set<string> = new Set([
  // Claim contract
  '0x9e6c6b22d07b0c6b525fd9ab61c30970880d0627',
  // Adam
  '0xE89CB2053A04Daf86ABaa1f4bC6D50744e57d39E'.toLowerCase(),
  // controller
  '0x3777b4b21489d2f0114e178c0cb2bb7332c8c3bd',
  // uniswap
  '0x8b39692e9d5959fd07d3251cece82de7a666f09d',
  //cheaters
  '0x9EE41Ea35da2FD1e01D136EC06F8951E50156175'.toLowerCase(),
  '0xbDfcd0F4eB0a75589B2223be05Ef42bbF7184E72'.toLowerCase(),
  '0x9c742A4555e4eEF1123cfA3fcd9c44fd015417EE'.toLowerCase(),
  //
  '0x0eFA0e39e67C2D3D02d2537B79f584F110b47B18'.toLowerCase(),
  '0x4A9E608e39ba076FC2EA14858132ddDc52c366e3'.toLowerCase(),
  '0x21c3a619B73c8D5CdA7AE74f100b86721E73654E'.toLowerCase(),
]);

export const getServerSideProps: GetServerSideProps<
  HeroesLandingPageProps
> = async (context) => {
  try {
    validateToken(context.params!);
    const token = context.params?.token as SupportedToken;

    const controllerSubgraphData = await fetchSubgraphData(
      configs[token].controllerAddress,
      configs[token].uniswapSubgraph,
      token,
    );

    if (!controllerSubgraphData) {
      return {
        notFound: true,
      };
    }

    const { paprController } = controllerSubgraphData;
    const allowedCollateral = paprController.allowedCollateral.map(
      (ac: any) => ac.contractAddress,
    );
    const underlying = paprController.underlying;
    const paprToken = paprController.paprToken;

    const oracleInfo = await getOracleInfoFromAllowedCollateral(
      allowedCollateral,
      token,
    );

    const participatingPlayers = Array.from(
      new Set(await getAllPaprHeroPlayers(token)),
    ).filter(
      (p) =>
        !DO_NOT_SHOW_THESE_ADDRESSES_ON_LEADERBOARD.has(p.id.toLowerCase()),
    );

    let paprPrice: BigNumber;
    try {
      paprPrice = await getQuoteForSwap(
        BigNumber.from(10).pow(18),
        paprToken,
        underlying,
        'paprHero',
      );
    } catch (e) {
      paprPrice = BigNumber.from(10).pow(6);
    }

    const playerScores: [string, HeroPlayerBalance][] = await Promise.all(
      participatingPlayers.map(async (p) => [
        p.id,
        await calculateNetPhUSDCBalance(p, paprPrice, oracleInfo, underlying),
      ]),
    );

    const rankedPlayers = playerScores.sort(
      (a, b) => b[1].totalBalance - a[1].totalBalance,
    );

    return {
      props: {
        token,
        allowedCollateral,
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
  allowedCollateral: string[];
  oracleInfo: { [key: string]: ReservoirResponseData };
  rankedPlayers: [string, HeroPlayerBalance][];
};
export default function HeroesLandingPage({
  token,
  allowedCollateral,
  oracleInfo,
  rankedPlayers,
}: HeroesLandingPageProps) {
  return (
    <>
      <OpenGraph title={`paprHero | Competition`} />
      <HeroesLandingPageContent
        collateral={allowedCollateral}
        oracleInfo={oracleInfo}
        rankedPlayers={rankedPlayers}
      />
    </>
  );
}
