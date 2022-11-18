import { ethers } from 'ethers';
import { currentPrice, WAD } from 'lib/auctions';

const oneDayInSeconds = ethers.BigNumber.from(60 * 60 * 24);
const startPrice = ethers.BigNumber.from(10).pow(18);
const perPeriodDecayPercentWad = WAD.mul(9).div(10);

describe('auction library', () => {
  describe('currentPrice', () => {
    it('after 0 seconds', () => {
      const result = currentPrice(
        startPrice,
        ethers.BigNumber.from(0),
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
        actual: ethers.utils.formatEther(result),
        expected: ethers.utils.formatEther(
          ethers.BigNumber.from(10).pow(17).sub(1),
        ),
      });
      expect(result).toEqual(ethers.BigNumber.from(10).pow(17).sub(1));
    });
  });
});
