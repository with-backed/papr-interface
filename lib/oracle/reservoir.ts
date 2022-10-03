export type ReservoirResponseData = {
  price: number;
  message: {
    id: string;
    payload: string;
    timestamp: number;
    signature: string;
  };
  data: string; // TODO(adamgobes): learn from reservoir team what this field is and how to decode it
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
