import { GetServerSideProps } from 'next';
import React from 'react';
import { captureException } from '@sentry/nextjs';
import { configs, SupportedToken, validateToken } from 'lib/config';
import { OpenGraph } from 'components/OpenGraph';
import { HeroesLandingPageContent } from 'components/LandingPageContent/PaprHeroes/HeroesLandingPageContent';
import {
  buildToken,
  getOracleInfoFromAllowedCollateral,
  getQuoteForSwap,
} from 'lib/controllers';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { calculateNetPhUSDCBalance, HeroPlayerBalance } from 'lib/paprHeroes';
import { fetchSubgraphData } from 'lib/PaprController';
import { getAllPaprHeroPlayers } from 'lib/pAPRSubgraph';
import { ONE } from 'lib/constants';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { getPool } from 'lib/controllers/uniswap';
import { ERC20__factory, IUniswapV3Pool__factory } from 'types/generated/abis';
import { makeProvider } from 'lib/contracts';

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

    const { paprController, pool } = controllerSubgraphData;
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

    let paprPrice: ethers.BigNumber;
    try {
      paprPrice = await getQuoteForSwap(
        ethers.BigNumber.from(10).pow(18),
        paprToken,
        underlying,
        'paprHero',
      );
    } catch (e) {
      paprPrice = ethers.BigNumber.from(10).pow(6);
    }

    const provider = makeProvider(configs[token].jsonRpcProvider, 'paprHero');
    const poolContract = IUniswapV3Pool__factory.connect(pool.id, provider);

    const token0Address = pool.token0.id;
    const token1Address = pool.token1.id;
    const [token0, token1] = await Promise.all([
      buildToken(ERC20__factory.connect(token0Address, provider)),
      buildToken(ERC20__factory.connect(token1Address, provider)),
    ]);

    const uniswapPool = await getPool(
      poolContract,
      token0,
      token1,
      configs[token].chainId,
    );

    const playerScores: [string, HeroPlayerBalance][] = await Promise.all(
      participatingPlayers.map(async (p) => [
        p.id,
        await calculateNetPhUSDCBalance(
          p,
          paprController,
          uniswapPool,
          paprPrice,
          oracleInfo,
        ),
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
