export function currentPrice(
  startPrice: BigNumber,
  secondsElapsed: number,
  secondsInPeriod: number,
  perPeriodDecayPercent: number,
) {
  const ratio = secondsElapsed / secondsInPeriod;
  const percentRemainingPerPeriod = 1 - perPeriodDecayPercent;
  const m = Math.pow(percentRemainingPerPeriod, ratio);
  const q = Math.floor(m * 1e10);
  const p = startPrice.mul(q).div(1e10);
  return p;
}
