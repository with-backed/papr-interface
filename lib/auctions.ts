import { ethers } from 'ethers';

export function currentPrice(
  startPrice: ethers.BigNumber,
  secondsElapsed: number,
  secondsInPeriod: number,
  perPeriodDecayPercent: number,
) {
  const ratio = secondsElapsed / secondsInPeriod;
  const percentRemainingPerPeriod = 1 - perPeriodDecayPercent;
  const m = Math.pow(percentRemainingPerPeriod, ratio);
  const q = Math.floor(m * 1e10);
  const p = startPrice.mul(q).div(1e10);
  return p.add(ethers.BigNumber.from(1000000000)); // small padding of 0.000000001 to ensure max price is big enough;
}
