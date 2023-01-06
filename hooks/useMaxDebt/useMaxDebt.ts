import { multicall } from '@wagmi/core';
import { BigNumber, ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useCallback, useEffect, useState } from 'react';

const maxDebtABI = [
  {
    name: 'maxDebt',
    inputs: [
      {
        name: 'totalCollateraValue',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useMaxDebt(collateralAssets: string[]) {
  const { controllerAddress } = useConfig();
  const {
    underlying: { decimals: underlyingDecimals },
  } = useController();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const [result, setResult] = useState<BigNumber | null>(null);

  const call = useCallback(async () => {
    if (!oracleInfo) {
      return null;
    }

    // Result will be BigNumber[], but have to cast due to TS limitation
    const totalDebtPerCollateralUnknown = await multicall({
      contracts: collateralAssets.map((asset) => ({
        address: controllerAddress as `0x${string}`,
        abi: maxDebtABI,
        functionName: 'maxDebt',
        args: [
          ethers.utils.parseUnits(
            oracleInfo[getAddress(asset)].price.toString(),
            underlyingDecimals,
          ),
        ],
      })),
    });

    const totalDebtPerCollateral = totalDebtPerCollateralUnknown as BigNumber[];
    return totalDebtPerCollateral.reduce(
      (a, b) => a.add(b),
      ethers.BigNumber.from(0),
    );
  }, [collateralAssets, controllerAddress, oracleInfo, underlyingDecimals]);

  useEffect(() => {
    call().then(setResult);
  }, [call]);

  return result;
}
