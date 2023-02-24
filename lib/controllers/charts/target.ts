import { ethers } from 'ethers';
import { TargetUpdate } from 'hooks/useTarget';
import { UTCTimestamp } from 'lightweight-charts';
import { TargetUpdatesByControllerQuery } from 'types/generated/graphql/inKindSubgraph';

export function targets(
  targetUpdates: TargetUpdatesByControllerQuery['targetUpdates'],
  targetUpdate: TargetUpdate,
  underlyingDecimals: ethers.BigNumberish,
) {
  const sortedTargets = [...targetUpdates].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  // get what target would be if updated at this moment and add to array
  if (sortedTargets.length > 0) {
    const { newTarget, timestamp } = targetUpdate;
    sortedTargets.push({
      id: 'filler',
      newTarget,
      timestamp,
    });
  }

  const formattedTargets = sortedTargets.map((target) => {
    const t = target.timestamp;
    return {
      value: parseFloat(
        ethers.utils.formatUnits(
          ethers.BigNumber.from(target.newTarget),
          underlyingDecimals,
        ),
      ),
      time: t as UTCTimestamp,
    };
  });
  return formattedTargets;
}
