import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { ONE } from 'lib/constants';
import { convertOneScaledValue } from 'lib/controllers';

const oneDayInSeconds = 60 * 60 * 24;
const startPrice = ethers.BigNumber.from(10).pow(18);
const perPeriodDecayPercentWad = convertOneScaledValue(ONE.mul(9).div(10), 8);

function approximatelyEquals(n1: ethers.BigNumber, n2: ethers.BigNumber) {
  const tolerance = ethers.utils.parseEther('0.000000001');
  return n1.sub(n2).abs().lt(tolerance);
}

describe('auction library', () => {
  describe('currentPrice', () => {
    it.each([
      [0, startPrice],
      [1, ethers.BigNumber.from(10).pow(17)],
      [2, ethers.BigNumber.from(10).pow(16)],
      [3, ethers.BigNumber.from(10).pow(15)],
      [4, ethers.BigNumber.from(10).pow(14)],
      [10, ethers.BigNumber.from(10).pow(8)],
    ])('after %d days', (numDays, expected) => {
      const result = currentPrice(
        startPrice,
        numDays * oneDayInSeconds,
        oneDayInSeconds,
        perPeriodDecayPercentWad,
      );
      expect(approximatelyEquals(result, expected)).toBeTruthy();
    });
  });
});
