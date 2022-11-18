import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { ONE } from 'lib/constants';
import { convertOneScaledValue } from 'lib/controllers';

const oneDayInSeconds = 60 * 60 * 24;
const startPrice = ethers.BigNumber.from(10).pow(18);
const perPeriodDecayPercentWad = convertOneScaledValue(ONE.mul(9).div(10), 8);

function approximatelyEquals(n1: ethers.BigNumber, n2: ethers.BigNumber) {
  const tolerance = ethers.utils.parseEther('0.01');
  return n1.sub(n2).abs().lt(tolerance);
}

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
      expect(
        approximatelyEquals(result, ethers.BigNumber.from(10).pow(17)),
      ).toBeTruthy();
    });
  });
});
