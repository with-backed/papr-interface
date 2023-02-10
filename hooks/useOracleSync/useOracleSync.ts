import { useConfig } from 'hooks/useConfig';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { getLatestBlockTimestamp } from 'lib/chainHelpers';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useEffect, useState } from 'react';

export function useOracleSync(
  collateralContractAddress: string,
  oracleKind: OraclePriceType,
) {
  const oracleInfo = useOracleInfo(oracleKind);
  const { jsonRpcProvider } = useConfig();

  const [synced, setSynced] = useState<boolean>(false);
  const [blockTimestamp, setBlockTimestamp] = useState<number>(0);

  useEffect(() => {
    const fetchBlockTimestamp = async () => {
      const blockTimestamp = await getLatestBlockTimestamp(jsonRpcProvider);
      setBlockTimestamp(blockTimestamp);
    };

    fetchBlockTimestamp();
    setInterval(() => {
      fetchBlockTimestamp();
    }, 1000);
  }, [oracleInfo, jsonRpcProvider]);

  useEffect(() => {
    if (!blockTimestamp || !oracleInfo) return;
    if (
      blockTimestamp >= oracleInfo[collateralContractAddress].message.timestamp
    ) {
      setSynced(true);
    }
  }, [blockTimestamp, oracleInfo, collateralContractAddress]);

  return synced;
}
