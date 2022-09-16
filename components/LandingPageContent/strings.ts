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
      'The value of pAPR algorithmically adjusts to target a steady rate of growth.',
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
      'To borrow, NFT collectors deposit collateral from an approved collection and are minted pAPR which is swapped for USDC.',
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
    content:
      'So if the market price of pAPR is too low, the contract increases its internal exchange rate to encourage borrowers to repay and shrink the supply of pAPR.',
    id: 'high-price',
    image: PaprGoesUp,
  },
  {
    content:
      'If the market price of pAPR is too high, the contract decreases its rate, encouraging borrowers to deposit collateral and mint pAPR.',
    id: 'low-price',
    image: PaprGoesDown,
  },
  {
    content: [
      'Borrowers get instant USDC loans at an interest rate determined by the market.',
      'Lenders earn interest by holding the pAPR token as it appreciates.',
      'Liquidity providers on Uniswap hold both tokens and earn fees as they facilitate the exchange.',
    ],
    id: 'uniswap',
    image: Uniswap,
  },
];
