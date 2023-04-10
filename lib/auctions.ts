import { ethers } from 'ethers';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';

import { convertOneScaledValue } from './controllers';

export type AuctionType = NonNullable<AuctionQuery['auction']>;

export function currentPrice(auction: AuctionType, timestamp: number) {
  const startPrice = ethers.BigNumber.from(auction.startPrice);
  const secondsInPeriod = parseInt(auction.secondsInPeriod);
  const perPeriodDecayPercent = convertOneScaledValue(
    ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
    4,
  );

  const secondsElapsed = timestamp - auction.start.timestamp;
  const ratio = secondsElapsed / secondsInPeriod;
  const percentRemainingPerPeriod = 1 - perPeriodDecayPercent;
  const m = Math.pow(percentRemainingPerPeriod, ratio);
  const q = Math.floor(m * 1e10);
  const p = startPrice.mul(q).div(1e10);
  return p.add(ethers.BigNumber.from(1000000000)); // small padding of 0.000000001 to ensure max price is big enough;
}
