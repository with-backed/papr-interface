import React from 'react';
import styles from './LandingPageContent.module.css';
import { Disclosure } from 'components/Disclosure';
import LoopDiagram from 'public/loop-diagram.png';
import Image from 'next/image';

const FAQ_ENTRIES: [string, JSX.Element][] = [
  [
    'How are interest rates set?',
    <div key="rate">
      <p>
        Papr interest rates and the papr trading price are in a constant
        feedback loop. Interest rates are programmatically updated on chain as a
        function of papr&apos;s trading price on Uniswap (the lower the trading
        price, the higher the interest to borrowers), and interest rates in turn
        affect the trading price, as borrowers open and close loans in response
        to rates.
      </p>
      <Image
        src={LoopDiagram}
        alt="Diagram illustrating how interest rates are set"
      />
    </div>,
  ],
  [
    'How is interest paid?',
    <p key="payout">
      Interest accrues to the value of papr itself: over time, new borrowers are
      allowed less papr for the exact same collateral. When closing a loan,
      borrowers repay the exact same amount of papr that they minted. However,
      due to interest charges, it is expected that the market value of papr will
      have risen since they opened their loan.
    </p>,
  ],
  [
    'What’s the benefit of doing this with a token?',
    <p key="token-reason">
      As a token, papr is traded external to the protocol. This means its price
      can incorporate external forces or new information in the market,
      accurately reflecting the sentiment of the market in real time. In this
      way, the market price of papr discovers the interest rate for loans that
      perfectly balances borrower&apos;s demand for loans and lenders&apos;
      willingness to provide capital.
    </p>,
  ],
  [
    'How do liquidations happen?',
    <div key="liquidations">
      <p>
        Loans have a max LTV of 50%. That means that the total debt owed — the
        principal plus interest — cannot exceed 50% of the collateral NFT&apos;s
        floor value. This is calculated based on the 30-day time-weighted
        average floor listing, which can change over the life of a loan.
      </p>
      <p>
        Borrowers are free to borrow any amount up to the Max, but the higher
        the amount, the less room there is for the loan to accumulate interest
        before coming due, and less tolerance for the value of the collateral
        NFT falling. If loan crosses the liquidation threshold, a collateral
        item may be triggered for auction. Liquidation auctions are structured
        as exponential-decay Dutch auctions, which start at 3x the floor value
        of the NFT and decrease 70% per day, selling to the first willing buyer.
        The proceeds are credited to the Borrower, which may lower the
        loan&apos;s LTV to an acceptable level.
      </p>
    </div>,
  ],
];

export function FAQ() {
  return (
    <div className={styles['faq-container']}>
      <h2>
        Wait, how does papr
        <br />
        work exactly?
      </h2>
      <div className={styles.rules}>
        {FAQ_ENTRIES.map(([question, answer]) => (
          <Disclosure key={question} title={question}>
            {answer}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
