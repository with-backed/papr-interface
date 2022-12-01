import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { configs, SupportedToken, validateToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import { HeroesLandingPageContent } from 'components/LandingPageContent/PaprHeroes/HeroesLandingPageContent';
import {
  getOracleInfoFromAllowedCollateral,
  getQuoteForSwap,
} from 'lib/controllers';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { calculateNetPhUSDCBalance, HeroPlayerBalance } from 'lib/paprHeroes';
import { fetchSubgraphData } from 'lib/PaprController';
import { getAllPaprHeroPlayers } from 'lib/pAPRSubgraph';
import { ONE } from 'lib/constants';
import { ethers } from 'ethers';

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
    );

    const paprPrice = await getQuoteForSwap(
      ethers.BigNumber.from(1),
      paprToken,
      underlying,
      'paprHero',
    );
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
