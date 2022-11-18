import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { ONE } from 'lib/constants';

const oneDayInSeconds = 60 * 60 * 24;
const startPrice = ethers.BigNumber.from(10).pow(18);
const perPeriodDecayPercentWad = ONE.mul(9).div(10).div(ONE).toNumber();

describe('auction library', () => {
  describe('currentPrice', () => {
    it('after 0 seconds', () => {
      const result = currentPrice(
        startPrice,
        0,
        oneDayInSeconds,
        perPeriodDecayPercentWad,
      );
      expect(result).toEqual(startPrice);
    });
    it('after 1 day', () => {
      const result = currentPrice(
        startPrice,
        oneDayInSeconds,
        oneDayInSeconds,
        perPeriodDecayPercentWad,
      );
      console.log({
        result: ethers.utils.formatEther(result),
        expected: ethers.utils.formatEther(ethers.BigNumber.from(10).pow(17)),
      });
      expect(result).toEqual(ethers.BigNumber.from(10).pow(17));
    });
  });
});
