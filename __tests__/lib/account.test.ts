import { ethers } from 'ethers';
import { resolveEns } from 'lib/account';
import { configs } from 'lib/config';

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
