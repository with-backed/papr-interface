import { getAddress } from 'ethers/lib/utils';
import { useConfig } from 'hooks/useConfig';
import { Config, SupportedToken } from 'lib/config';
import { getOracleInfoFromAllowedCollateral } from 'lib/controllers';
import { OraclePriceType, ReservoirResponseData } from 'lib/oracle/reservoir';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const ORACLE_POLL_INTERVAL = 1200000;

export type OracleInfo = { [key: string]: ReservoirResponseData };
export type OracleInfoRepository = {
  [kind in OraclePriceType]: OracleInfo | undefined;
};

const EMPTY = {
  lower: undefined,
  upper: undefined,
  twap: undefined,
  spot: undefined,
};

export const OracleInfoContext = createContext<{
  oracleInfo: OracleInfoRepository;
  register: (kind: OraclePriceType) => void;
}>({ oracleInfo: EMPTY, register: (_kind: OraclePriceType) => null });

export function OracleInfoProvider({
  collections,
  children,
}: PropsWithChildren<{ collections: string[] }>) {
  const { tokenName } = useConfig();
  const [oracleInfoRepository, setOracleInfoRepository] =
    useState<OracleInfoRepository>(EMPTY);

  const register = useCallback(
    async (kind: OraclePriceType) => {
      const setLatestOracleInfo = async () => {
        const oracleInfo = await getOracleInfoFromAllowedCollateral(
          collections,
          tokenName as SupportedToken,
          kind,
        );
        setOracleInfoRepository((prev) => ({
          ...prev,
          [kind]: oracleInfo,
        }));
      };
      setLatestOracleInfo();
      const intervalId = setInterval(setLatestOracleInfo, ORACLE_POLL_INTERVAL);
      return () => clearInterval(intervalId);
    },
    [setOracleInfoRepository, tokenName, collections],
  );

  return (
    <OracleInfoContext.Provider
      value={{ oracleInfo: oracleInfoRepository, register }}>
      {children}
    </OracleInfoContext.Provider>
  );
}

export function useOracleInfo(kind: OraclePriceType) {
  const { oracleInfo, register } = useContext(OracleInfoContext);
  register(kind);

  return oracleInfo[kind];
}
