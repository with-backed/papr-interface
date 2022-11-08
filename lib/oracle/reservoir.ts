import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { ReservoirOracleUnderwriter } from 'types/generated/abis/Strategy';

export type ReservoirResponseData = {
  price: number;
  message: {
    id: string;
    payload: string;
    timestamp: number;
    signature: string;
  };
  data: string;
};

export const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 3600;

export async function getSignedOracleFloorPriceMessage(
  collection: string,
  config: Config,
  isHeroes: boolean = false,
): Promise<ReservoirResponseData> {
  const reservoirReq = await fetch(
    `${
      config.reservoirAPI
    }/oracle/collections/${collection}/floor-ask/v3?kind=twap&currency=${
      isHeroes ? config.paprHeroesUSDC : config.paprUnderlyingAddress
    }&twapSeconds=${THIRTY_DAYS_IN_SECONDS}`,
  );
  const json = await reservoirReq.json();
  return json;
}

export function getOraclePayloadFromReservoirObject(
  oracleFromReservoir: ReservoirResponseData,
): ReservoirOracleUnderwriter.OracleInfoStruct {
  const { v, r, s } = ethers.utils.splitSignature(
    oracleFromReservoir.message.signature,
  );

  const oraclePayload: ReservoirOracleUnderwriter.OracleInfoStruct = {
    message: {
      id: oracleFromReservoir.message.id,
      payload: oracleFromReservoir.message.payload,
      signature: oracleFromReservoir.message.signature,
      timestamp: oracleFromReservoir.message.timestamp,
    },
    sig: {
      v,
      r,
      s,
    },
  };

  return oraclePayload;
}
