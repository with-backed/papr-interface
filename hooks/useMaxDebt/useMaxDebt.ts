import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useTarget } from 'hooks/useTarget';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useMemo } from 'react';

function maxDebt(value: BigNumber, maxLTV: BigNumber, target: BigNumber) {
  const maxLoanUnderlying = value.mul(maxLTV);
  return maxLoanUnderlying.div(target);
}

export function useMaxDebt(...collateralAssets: string[]) {
  const target = useTarget();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const {
    underlying: { decimals },
    maxLTV,
  } = useController();

  const result = useMemo(() => {
    if (!oracleInfo || !target) {
      return null;
    }

    const totalDebtPerCollateral = collateralAssets.map((asset) =>
      maxDebt(
        parseUnits(oracleInfo[asset].price.toString(), decimals),
        maxLTV,
        target,
      ),
    );

    return totalDebtPerCollateral.reduce((a, b) => a.add(b), BigNumber.from(0));
  }, [collateralAssets, decimals, maxLTV, oracleInfo, target]);

  return result;
}
