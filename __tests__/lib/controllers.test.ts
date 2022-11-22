import { oracleInfoProxy } from 'lib/controllers';

const addressChecksum = '0xBeEf97f554A8505cc3F6472b1b3A4667D8421Fc4';
const addressNonChecksum = addressChecksum.toLowerCase();

const obj = {
  [addressChecksum]: 'it works',
};
const proxy = oracleInfoProxy(obj);

describe('controllers lib', () => {
  describe('oracleInfoProxy', () => {
    it('given checksummed input, returns the same result for checksummed and non-checksummed address', () => {
      expect(proxy[addressChecksum]).toEqual('it works');
      expect(proxy[addressNonChecksum]).toEqual('it works');
    });
    it('handles non-address input', () => {
      expect(proxy.lol).toBeUndefined();
    });
  });
});
