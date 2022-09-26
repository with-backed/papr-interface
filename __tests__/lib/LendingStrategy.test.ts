import { configs } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import {
  makeLendingStrategy,
  SubgraphStrategy,
  LendingStrategy,
  SubgraphPool,
} from 'lib/LendingStrategy';

const subgraphStrategy: SubgraphStrategy = {
  id: '0x41739c3547992ca3f2a40d110ad33afeb582eb7c',
  createdAt: '1663869096',
  name: 'APE Loans',
  symbol: 'AP',
  poolAddress: '0xcf93a7655d76b43313a69f15f01a39ea6ada5aea',
  underlying: '0x3089b47853df1b82877beef6d904a0ce98a12553',
  norm: '1000000000000000000',
  targetAPR: '200000000000000000',
  vaults: [],
  __typename: 'LendingStrategy',
};

const subgraphPool: SubgraphPool = {
  token0: {
    id: '0x3089b47853df1b82877beef6d904a0ce98a12553',
    decimals: '18',
    symbol: 'USDC',
    name: 'USDC',
    __typename: 'Token',
  },
  token1: {
    id: '0xb5e5f51e3e112634975fb44e6351380413f653ac',
    decimals: '18',
    symbol: 'dtAP_USDC',
    name: 'APE Loans debt token',
    __typename: 'Token',
  },
  __typename: 'Pool',
};

const provider = makeProvider(configs.goerli.jsonRpcProvider, 'goerli');

let strategyInstance = makeLendingStrategy(
  subgraphStrategy,
  subgraphPool,
  provider,
  configs.goerli,
);

describe('LendingStrategy', () => {
  describe('constructor', () => {
    it('dynamically puts subgraph properties at top-level', () => {
      // One manual check for specific value
      expect(strategyInstance.symbol).toEqual('AP');

      // Dynamic test to check all properties
      Object.keys(subgraphStrategy).forEach((key) => {
        const instanceValue =
          strategyInstance[
            (key === 'underlying'
              ? 'underlyingAddress'
              : key) as keyof LendingStrategy
          ];
        const inputValue = subgraphStrategy[key as keyof SubgraphStrategy];

        expect(instanceValue).toBeDefined();
        expect(inputValue).toBeDefined();
        expect(instanceValue).toEqual(inputValue);
      });
    });
  });
});