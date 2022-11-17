import React from 'react';
import PaprHeroesLogo from 'public/logos/paprHeroes.png';
import Hero1 from 'public/landing-page-nfts/hero-1.png';
import Hero2 from 'public/landing-page-nfts/hero-2.png';
import Hero3 from 'public/landing-page-nfts/hero-3.png';
import Hero4 from 'public/landing-page-nfts/hero-4.png';
import styles from './LandingPageContent.module.css';
import { ButtonLink } from 'components/Button';
import { Disclosure } from 'components/Disclosure';
import Image from 'next/image';
import { useTooltipState, TooltipReference } from 'reakit/Tooltip';
import { Tooltip } from 'components/Tooltip';

const Logo = () => <img src={PaprHeroesLogo.src} alt="" />;

// TODO: make this dynamic when we have some scores
function Leaderboard() {
  return (
    <div className={styles.leaderboard}>
      <h3>LEADERBOARD</h3>
      <dl>
        <dt>
          superdude.eth
          <div className={styles.dotted} />
        </dt>
        <dd>18,239 USDC</dd>
        <dt>
          vitalik.eth
          <div className={styles.dotted} />
        </dt>
        <dd>17,267 USDC</dd>
        <dt>
          0xa47381e
          <div className={styles.dotted} />
        </dt>
        <dd>17,221 USDC</dd>
      </dl>
    </div>
  );
}

function Rules() {
  const currencyName = <i>phUSDC</i>;
  return (
    <div className={styles.rules}>
      <Disclosure title="Rules of the game">
        <p>
          Papr Hero is a PVP competition where players compete to see who can
          end up with the most {currencyName}. Every player starts with a fixed
          amount of {currencyName} and eligible NFTs. Players can perform one or
          more of the following actions to increase their {currencyName}{' '}
          balance:
        </p>
        <ol>
          <li>Lock NFTs as collateral and borrow {currencyName}</li>
          <li>Stake {currencyName} for 10% APR</li>
          <li>Sell their NFTs for {currencyName}</li>
          <li>Buy NFTs with their {currencyName}</li>
        </ol>
        <p>
          At the end of the competition, a users final {currencyName} score is
          the sum of their {currencyName} balance as well as the value of their
          NFTs (as calculated by the floor price of the collection)
        </p>
      </Disclosure>
    </div>
  );
}

export function PaprHeroes() {
  const tooltip1 = useTooltipState();
  const tooltip2 = useTooltipState();
  const tooltip3 = useTooltipState();
  const tooltip4 = useTooltipState();
  return (
    <div className={styles['papr-heroes-container']}>
      <Logo />
      <h2>
        A testnet competition, with fake money and Goerli versions of CC0 NFTs.
      </h2>
      <ButtonLink
        kind="outline"
        theme="hero"
        href="https://backed.mirror.xyz/8SslPvU8of0h-fxoo6AybCpm51f30nd0qxPST8ep08c">
        Coming soon! Subscribe for updates ↗
      </ButtonLink>
      <div className={styles.heroes}>
        <TooltipReference {...tooltip1}>
          <Image src={Hero1} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip1}>
          <div className={styles.tooltip}>
            CryptoToadz
            <br />
            Floor Price: 1.385 ETH
            <br />
            Max Loan: 837.23 USDC
          </div>
        </Tooltip>
        <TooltipReference {...tooltip2}>
          <Image src={Hero2} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip2}>
          <div className={styles.tooltip}>
            Moonbirds
            <br />
            Floor Price: 7.35 ETH
            <br />
            Max Loan: 4,443.08 USDC
          </div>
        </Tooltip>
        <TooltipReference {...tooltip3}>
          <Image src={Hero3} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip3}>
          <div className={styles.tooltip}>
            Tiny Dinos
            <br />
            Floor Price: 0.0489 ETH
            <br />
            Max Loan: 29.56 USDC
          </div>
        </Tooltip>
        <TooltipReference {...tooltip4}>
          <Image src={Hero4} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip4}>
          <div className={styles.tooltip}>
            Blitmap
            <br />
            Floor Price: 3.149 ETH
            <br />
            Max Loan: 1,903.57 USDC
          </div>
        </Tooltip>
      </div>
      {/* <Leaderboard /> */}
    </div>
  );
}
