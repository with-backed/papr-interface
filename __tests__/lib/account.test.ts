import { ethers } from 'ethers';
import { resolveEns } from 'lib/account';
import { configs } from 'lib/config';

jest.mock('lib/contracts', () => ({
  ...jest.requireActual('lib/contracts'),
  jsonRpcERC20Contract: jest.fn().mockReturnValue({
    balanceOf: jest.fn().mockResolvedValue(10000000000),
    allowance: jest.fn().mockResolvedValue(10000000000),
  }),
  web3Erc20Contract: jest.fn().mockReturnValue({
    approve: jest.fn().mockResolvedValue({ hash: '0xhash' }),
  }),
}));

const providerSpy = jest.spyOn(ethers.providers, 'JsonRpcProvider');
providerSpy.mockImplementation(
  () =>
    ({
      resolveName: jest.fn().mockResolvedValue('address.eth'),
    } as any),
);

describe('account utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveEns', () => {
    it('returns the value the provider resolves', async () => {
      const value = await resolveEns(
        '0xaddress',
        configs.paprHero.jsonRpcProvider,
      );
      expect(value).toEqual('address.eth');
    });
  });
});
