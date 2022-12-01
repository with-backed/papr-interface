import { ethers } from 'ethers';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { formatBigNum } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { PaprController } from 'lib/PaprController';
import { useEffect, useState } from 'react';

export function useLTVs(
  paprController: PaprController,
  activeVaults: PaprController['vaults'],
  maxLTV: ethers.BigNumber | null,
) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const [ltvs, setLTVs] = useState<{ [key: string]: number }>({});
  const [ltvsLoading, setLTVsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLTVs = async () => {
      if (!oracleInfo || !maxLTV || !activeVaults) return {};
      return await activeVaults.reduce(async (prev, v) => {
        const maxDebtForVault: ethers.BigNumber = (
          await paprController.maxDebt([v.collateralContract], oracleInfo)
        ).mul(v.collateral.length);
        const maxNumber = parseFloat(
          formatBigNum(maxDebtForVault, paprController.debtToken.decimals),
        );
        const debtNumber = parseFloat(
          formatBigNum(v.debt, paprController.debtToken.decimals),
        );

        return {
          ...prev,
          [v.id]:
            (debtNumber / maxNumber) *
            parseFloat(ethers.utils.formatEther(maxLTV)),
        };
      }, {});
    };

    fetchLTVs().then((ltvs) => {
      setLTVs(ltvs);
      setLTVsLoading(false);
    });
  }, [paprController, activeVaults, maxLTV, oracleInfo]);

  return { ltvs, ltvsLoading };
}