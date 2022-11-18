import { getAddress } from 'ethers/lib/utils';
import { useConfig } from 'hooks/useConfig';
import { Config, SupportedToken } from 'lib/config';
import { getOracleInfoFromAllowedCollateral } from 'lib/controllers';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
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
  children,
}: PropsWithChildren<{ collections: string[] }>) {
  const { tokenName } = useConfig();
  const [oracleInfo, setOracleInfo] = useState<OracleInfo | null>(null);

  useEffect(() => {
    const setLatestOracleInfo = async () => {
      console.log('this is running');
      const oracleInfo = await getOracleInfoFromAllowedCollateral(
        collections,
        tokenName as SupportedToken,
      );
      setOracleInfo(oracleInfo);
    };
    setLatestOracleInfo();
    const intervalId = setInterval(setLatestOracleInfo, ORACLE_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [setOracleInfo, tokenName, collections]);

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
