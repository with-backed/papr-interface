import { BigNumber, BigNumberish } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useTarget } from 'hooks/useTarget';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useMemo } from 'react';

export function maxDebt(
  value: BigNumber,
  maxLTV: BigNumberish,
  target: BigNumber,
) {
  const maxLoanUnderlying = value.mul(maxLTV);
  return maxLoanUnderlying.div(target);
}

export function useMaxDebt(collateralAsset: string): BigNumber | null;
export function useMaxDebt(collateralAssets: string[]): BigNumber | null;
export function useMaxDebt(collateral: string | string[]): BigNumber | null {
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

    if (typeof collateral === 'string') {
      return maxDebt(
        parseUnits(oracleInfo[collateral].price.toString(), decimals),
        maxLTV,
        target,
      );
    }

    const totalDebtPerCollateral = collateral.map((asset) =>
      maxDebt(
        parseUnits(oracleInfo[asset].price.toString(), decimals),
        maxLTV,
        target,
      ),
    );

    return totalDebtPerCollateral.reduce((a, b) => a.add(b), BigNumber.from(0));
  }, [collateral, decimals, maxLTV, oracleInfo, target]);

  return result;
}
