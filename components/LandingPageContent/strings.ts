import { Borrow } from './landing-page-images/Borrow';
import { Math } from './landing-page-images/Math';
import { PaprGoesDown } from './landing-page-images/PaprGoesDown';
import { PaprGoesUp } from './landing-page-images/PaprGoesUp';
import { Swap } from './landing-page-images/Swap';
import { TargetGrowthText } from './landing-page-images/TargetGrowthText';
import { Uniswap } from './landing-page-images/Uniswap';

export const landingPageStrings = [
  {
    content: [
      'The value of pAPR auto-calibrates to target a steady rate of growth.',
      '(It’s perpetually trying to grow at a predetermined annual rate.)',
    ],
    id: 'value',
  },
  {
    content: [
      'To borrowers, this rate is the cost of holding a loan over time, effectively the interest that borrowers pay.',
      'To lenders, this rate of appreciation is what they earn by holding the pAPR token.',
    ],
    id: 'borrowers-and-lenders',
    image: TargetGrowthText,
  },
  {
    content: 'To buy, lenders simply swap USDC for pAPR on Uniswap. ',
    id: 'buy',
    image: Swap,
  },
  {
    content:
      'Every pAPR token has a class of collateral it represents and is part of a pool on Uniswap where it is paired with USDC.',
    id: 'collateral-class',
  },
  {
    content: [
      'To borrow, NFT collectors deposit collateral from an approved collection and mint pAPR which is swapped for USDC.',
      'When borrowers repay a loan, thier NFT is released to them and the pAPR used to repay the loan is burned.',
    ],
    id: 'deposit-repay',
    image: Borrow,
  },
  {
    content:
      'This exchange rate for minting/burning is determined by the contract, which increases or decreases the rate depending on how close the market price on Uniswap follows the target growth.',
    id: 'exchange',
    image: Math,
  },
  {
    content: [
      'So if the market price of pAPR is too low, the contract increases its internal exchange rate to encourage borrowers to repay and shrink the supply of pAPR.',
      'Borrowers are pressured to repay by a higher exchange rate because it is used by the contract to calculate a loan’s LTV (loan-to-value, the amount owed in principal and interest compared to the value of the collateral). Once a loan reaches a strategy’s predefined “Max LTV,” it must repay or else the collateral will be auctioned off to pay the debt. ',
    ],
    id: 'low-price',
    image: PaprGoesUp,
  },
  {
    content: [
      'Conversely, if the market price of pAPR is higher than what the target growth requires, the contract decreases its internal exchange rate.',
      'This lower rate means the contract values pAPR more cheaply, minting more to borrowers in exchange for depositing their collateral. The supply increases with the goal of lowering the market price, bringing it back into line with the target growth rate.',
    ],
    id: 'high-price',
    image: PaprGoesDown,
  },
  {
    content: [
      'The goal of the contract is the match the target growth rate, respond to changes in the market, and offer every participant unique value not met by other lending protocols.',
      'Borrowers get instant loans at a fair interest rate determined by the market. Their risk is lower than other lending protocols because changes in floor price don’t effect liquidation.',
      'Lenders earn interest by holding the pAPR token as it appreciates. With no management or oversight, they can benefit from a lending strategy with a single trade on Uniswap.',
      'Liquidity providers on Uniswap hold both tokens and earn fees as they facilitate the exchange.',
      'As market conditions change, the pressure from these different actors weighs on the value of pAPR tokens. As perpetual tokens, the can be continuously calibrated to achieve equilibrium.',
    ],
    id: 'uniswap',
    image: Uniswap,
  },
];
