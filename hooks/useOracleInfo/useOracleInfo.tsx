import { getAddress } from 'ethers/lib/utils';
import { useConfig } from 'hooks/useConfig';
import { Config, SupportedToken } from 'lib/config';
import { getOracleInfoFromAllowedCollateral } from 'lib/controllers';
import { OraclePriceType, ReservoirResponseData } from 'lib/oracle/reservoir';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

const ORACLE_POLL_INTERVAL = 1200000;

export type OracleInfo = { [key: string]: ReservoirResponseData };

export const OracleInfoContext = createContext<OracleInfo | null>(null);

export function OracleInfoProvider({
  collections,
  kind,
  children,
}: PropsWithChildren<{ collections: string[]; kind: OraclePriceType }>) {
  const { tokenName } = useConfig();
  const [oracleInfo, setOracleInfo] = useState<OracleInfo | null>(null);

  useEffect(() => {
    const setLatestOracleInfo = async () => {
      const oracleInfo = await getOracleInfoFromAllowedCollateral(
        collections,
        tokenName as SupportedToken,
        kind,
      );
      setOracleInfo(oracleInfo);
    };
    setLatestOracleInfo();
    const intervalId = setInterval(setLatestOracleInfo, ORACLE_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [setOracleInfo, tokenName, collections, kind]);

  return (
    <OracleInfoContext.Provider value={oracleInfo}>
      {children}
    </OracleInfoContext.Provider>
  );
}

export function useOracleInfo() {
  const oracleInfo = useContext(OracleInfoContext);
  return oracleInfo;
}
