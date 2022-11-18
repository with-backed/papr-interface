import { ethers } from 'ethers';

export const WAD = ethers.BigNumber.from(10).pow(18);

export function currentPrice(
  startPrice: ethers.BigNumber,
  secondsElapsed: ethers.BigNumber,
  secondsInPeriod: ethers.BigNumber,
  perPeriodDecayPercentWad: ethers.BigNumber,
) {
  const ratio = secondsElapsed.div(secondsInPeriod);
  const percentRemainingPerPeriod = WAD.sub(perPeriodDecayPercentWad);
  const m = percentRemainingPerPeriod.pow(ratio);
  const p = startPrice.mul(m);
  return p.div(WAD);
}
