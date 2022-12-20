import { captureException } from '@sentry/nextjs';
import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { ReservoirOracleUnderwriter } from 'types/generated/abis/PaprController';

export enum OraclePriceType {
  spot = 'spot',
  twap = 'twap',
  lower = 'lower',
  upper = 'upper',
}

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
  kind: OraclePriceType,
): Promise<ReservoirResponseData | null> {
  let reservoirRes: Response;
  try {
    reservoirRes = await fetch(
      `${config.reservoirAPI}/oracle/collections/${collection}/floor-ask/v3?kind=${kind}&currency=${config.paprUnderlyingAddress}&twapSeconds=${THIRTY_DAYS_IN_SECONDS}`,
      {
        headers: {
          'x-api-key': process.env.RESERVOIR_KEY || '',
        },
      },
    );
    const json = await reservoirRes.json();
    return json;
  } catch (e) {
    captureException(e);
    return null;
  }
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
