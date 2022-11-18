import { ethers } from 'ethers';

export function currentPrice(
  startPrice: ethers.BigNumber,
  secondsElapsed: ethers.BigNumber,
  secondsInPeriod: ethers.BigNumber,
  perPeriodDecayPercentWad: ethers.BigNumber,
) {
  return startPrice.mul(
    perPeriodDecayPercentWad.pow(secondsElapsed.div(secondsInPeriod)),
  );
}
