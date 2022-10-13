import { ethers } from 'ethers';
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

export const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDC_DECIMALS = 6;
export const THIRTY_DAYS_IN_SECONDS = 2592000;
export const BASE_RESERVOIR_URL = 'https://api.reservoir.tools';

export async function getSignedOracleFloorPriceMessage(
  collection: string,
): Promise<ReservoirResponseData> {
  const reservoirReq = await fetch(
    `${BASE_RESERVOIR_URL}/oracle/collections/${collection}/floor-ask/v3?kind=twap&currency=${USDC_CONTRACT}&twapSeconds=${THIRTY_DAYS_IN_SECONDS}`,
  );
  const json = await reservoirReq.json();
  return json;
}

export async function getOraclePayloadFromReservoirObject(
  oracleFromReservoir: ReservoirResponseData,
): Promise<ReservoirOracleUnderwriter.OracleInfoStruct> {
  const { v, r, s } = await ethers.utils.splitSignature(
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
