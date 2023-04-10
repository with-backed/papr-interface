import { ethers } from 'ethers';
import { AuctionType, currentPrice } from 'lib/auctions';

const startTimestamp = 10_000;
const oneDayInSeconds = 60 * 60 * 24;
const startPrice = ethers.BigNumber.from(10).pow(18);
const perPeriodDecayPercentWad = ethers.BigNumber.from('900000000000000000');

const mockAuction: Partial<AuctionType> = {
  start: {
    timestamp: startTimestamp,
  },
  perPeriodDecayPercentWad,
  startPrice,
  secondsInPeriod: oneDayInSeconds,
};

export function approximatelyEquals(
  n1: ethers.BigNumber,
  n2: ethers.BigNumber,
) {
  const tolerance = ethers.utils.parseEther('0.00000001');
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
      const timestamp = numDays * oneDayInSeconds + startTimestamp;
      const result = currentPrice(mockAuction as AuctionType, timestamp);
      expect(approximatelyEquals(result, expected)).toBeTruthy();
    });
  });
});
