import { BigNumber, BigNumberish } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { useController } from 'hooks/useController';
import { OracleInfo, useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { TargetUpdate, useTarget } from 'hooks/useTarget';
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

export function useMaxDebt(
  collateralAsset: string,
  oraclePriceType: OraclePriceType,
): BigNumber | null;
export function useMaxDebt(
  collateralAssets: string[],
  oraclePriceType: OraclePriceType,
): BigNumber | null;
export function useMaxDebt(
  collateral: string | string[],
  oraclePriceType: OraclePriceType,
): BigNumber | null {
  const targetResult = useTarget();
  const oracleInfo = useOracleInfo(oraclePriceType);
  const {
    underlying: { decimals },
    maxLTV,
  } = useController();

  const result = useMemo(() => {
    return calculateMaxDebt(
      collateral,
      oracleInfo,
      targetResult,
      maxLTV,
      decimals,
    );
  }, [collateral, decimals, maxLTV, oracleInfo, targetResult]);

  return result;
}

export function calculateMaxDebt(
  collateral: string | string[],
  oracleInfo: OracleInfo | undefined,
  targetResult: TargetUpdate | undefined,
  maxLTV: BigNumberish,
  decimals: number,
) {
  if (!oracleInfo || !targetResult) {
    return null;
  }

  if (typeof collateral === 'string') {
    if (!oracleInfo[collateral]?.price) {
      return null;
    }
    return maxDebt(
      parseUnits(oracleInfo[collateral].price.toString(), decimals),
      maxLTV,
      targetResult.target,
    );
  }

  const totalDebtPerCollateral = collateral.map((asset) =>
    maxDebt(
      parseUnits(oracleInfo[asset].price.toString(), decimals),
      maxLTV,
      targetResult.target,
    ),
  );

  return totalDebtPerCollateral.reduce((a, b) => a.add(b), BigNumber.from(0));
}
