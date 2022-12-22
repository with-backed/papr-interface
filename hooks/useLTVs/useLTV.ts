import { ethers } from 'ethers';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { computeLTVFromDebts } from 'lib/controllers';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { PaprController } from 'lib/PaprController';
import { useEffect, useState } from 'react';

export function useLTV(
  paprController: PaprController,
  collateralContractAddress: string | undefined,
  numberOfCollateralTokens: number | undefined,
  vaultDebt: ethers.BigNumber,
  maxLTV: ethers.BigNumber | null,
) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const [ltv, setLTV] = useState<number | null>(null);
  const [ltvLoading, setLTVLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLTV = async () => {
      if (
        !oracleInfo ||
        // These checks are required because the types for the graphql result indicate
        // that the fields may not be present; in practice they should be defined.
        !collateralContractAddress ||
        !numberOfCollateralTokens ||
        !maxLTV
      ) {
        return null;
      }
      const maxDebtForToken = await paprController.maxDebt(
        [collateralContractAddress],
        oracleInfo,
      );
      const maxDebtForVault = maxDebtForToken.mul(numberOfCollateralTokens);
      return computeLTVFromDebts(
        vaultDebt,
        maxDebtForVault,
        maxLTV,
        paprController.debtToken.decimals,
      );
    };

    fetchLTV().then((ltv) => {
      setLTV(ltv);
      setLTVLoading(false);
    });
  }, [
    collateralContractAddress,
    maxLTV,
    numberOfCollateralTokens,
    oracleInfo,
    paprController,
    vaultDebt,
  ]);

  return { ltv, ltvsLoading: ltvLoading };
}
