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
export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 3600;

export async function getSignedOracleFloorPriceMessage(
  collection: string,
  config: Config,
  kind: OraclePriceType,
): Promise<ReservoirResponseData | null> {
  let reservoirRes: Response;
  try {
    reservoirRes = await fetch(
      `${config.reservoirAPI}/oracle/collections/top-bid/v2?collection=${collection}&kind=${kind}&currency=${config.underlyingAddress}&twapSeconds=${SEVEN_DAYS_IN_SECONDS}`,
      {
        headers: {
          'x-api-key': process.env.RESERVOIR_KEY!,
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
  oracleFromReservoir: ReservoirResponseData | undefined,
): ReservoirOracleUnderwriter.OracleInfoStruct {
  // on initial page load, reservoir data is undefined -- return empty contract structs if so
  if (!oracleFromReservoir)
    return {
      message: {
        id: '',
        payload: '',
        signature: '',
        timestamp: '',
      },
      sig: {
        v: '',
        r: '',
        s: '',
      },
    };
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

export async function getNFTIsFlagged(
  contractAddress: string,
  tokenId: string,
  config: Config,
): Promise<boolean> {
  const encodedQueryParams = new URLSearchParams({
    tokens: `${contractAddress}:${tokenId}`,
  }).toString();

  const reservoirTokenRes = await fetch(
    `${config.reservoirAPI}/tokens/v5?${encodedQueryParams}`,
    {
      headers: {
        'x-api-key': process.env.RESERVOIR_KEY!,
      },
    },
  );
  const json = await reservoirTokenRes.json();

  if (!json.tokens || json.tokens.length === 0) return false;
  return json.tokens[0].token.isFlagged;
}

export async function getTopBidForCollectionAtTime(
  collection: string,
  timestamp: number,
  config: Config,
): Promise<number | null> {
  const encodedQueryParams = new URLSearchParams({
    collection,
    endTimestamp: timestamp.toString(),
  }).toString();

  const reservoirCollectionBidRes = await fetch(
    `${config.reservoirAPI}/events/collections/top-bid/v2?${encodedQueryParams}`,
    {
      headers: {
        'x-api-key': process.env.RESERVOIR_KEY!,
      },
    },
  );
  const json = await reservoirCollectionBidRes.json();

  if (!json.events || json.events.length === 0) return null;
  return json.events[0].topBid.price.amount.decimal;
}
