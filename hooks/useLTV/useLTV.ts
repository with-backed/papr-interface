import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { computeLTVFromDebts } from 'lib/controllers';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useMemo } from 'react';

export function useLTV(
  collateralContractAddress: string,
  numberOfCollateralTokens: number,
  vaultDebt: ethers.BigNumber,
) {
  const {
    maxLTV,
    paprToken: { decimals },
  } = useController();
  const maxDebtForToken = useMaxDebt(
    collateralContractAddress,
    OraclePriceType.twap,
  );

  const ltv = useMemo(() => {
    if (!maxDebtForToken) {
      return null;
    }
    const maxDebtForVault = maxDebtForToken.mul(numberOfCollateralTokens);
    return computeLTVFromDebts(
      vaultDebt,
      maxDebtForVault,
      ethers.BigNumber.from(maxLTV),
      decimals,
    );
  }, [decimals, maxDebtForToken, maxLTV, numberOfCollateralTokens, vaultDebt]);

  return ltv;
}
