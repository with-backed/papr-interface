import { configs } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import {
  makePaprController,
  SubgraphController,
  PaprController,
  SubgraphPool,
} from 'lib/PaprController';

const subgraphController: SubgraphController = {
  id: '0x41739c3547992ca3f2a40d110ad33afeb582eb7c',
  createdAt: '1663869096',
  poolAddress: '0xcf93a7655d76b43313a69f15f01a39ea6ada5aea',
  underlying: '0x3089b47853df1b82877beef6d904a0ce98a12553',
  target: '1000000000000000000',
  vaults: [],
  allowedCollateral: [
    {
      id: '0x41739c3547992ca3f2a40d110ad33afeb582eb7c-0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
      contractAddress: '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
      allowed: true,
    },
  ],
  __typename: 'PaprController',
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

const provider = makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero');

let controllerInstance = makePaprController(
  subgraphController,
  subgraphPool,
  provider,
  configs.paprHero,
);

describe('PaprController', () => {
  describe('constructor', () => {
    it('dynamically puts subgraph properties at top-level', () => {
      // Dynamic test to check all properties
      Object.keys(subgraphController).forEach((key) => {
        const instanceValue =
          controllerInstance[
            (key === 'underlying'
              ? 'underlyingAddress'
              : key) as keyof PaprController
          ];
        const inputValue = subgraphController[key as keyof SubgraphController];

        expect(instanceValue).toBeDefined();
        expect(inputValue).toBeDefined();
        expect(instanceValue).toEqual(inputValue);
      });
    });
  });
});
