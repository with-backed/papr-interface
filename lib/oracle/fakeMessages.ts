import { ethers } from 'ethers';
import {
  _TypedDataEncoder,
  arrayify,
  defaultAbiCoder,
  getAddress,
} from 'ethers/lib/utils';

import { OraclePriceType, ReservoirResponseData } from './reservoir';

export const dummyOracleInfoMap = {
  [getAddress('0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e')]: [36.32, 38.02],
  [getAddress('0x6ea6c63f60a1a99985c7acae03d7368b82785ca2')]: [
    1032.21, 1100.22,
  ],
  [getAddress('0x6ef2c9cb23f03014d18d7e4ceeaec497db00247c')]: [917.4, 1000.0],
  [getAddress('0x8232c5fd480c2a74d2f25d3362f262ff3511ce49')]: [
    1024.32, 1029.21,
  ],
  [getAddress('0x91036a17098a16a113fc0afe5967889e776eeee0')]: [234.21, 250.01],
  [getAddress('0xb7d7fe7995d1e347916faae8e16cfd6dd21a9bae')]: [
    1425.22, 1430.21,
  ],
};

const UNDERLYING_ADDRESS = '0xf5f4619764b3bcba95aba3b25212365fc6166862';
const UNDERLYING_DECIMALS = 6;

const EIP712_TYPES = {
  Message: {
    Message: [
      { name: 'id', type: 'bytes32' },
      { name: 'payload', type: 'bytes' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  ContractWideCollectionTopBidPrice: {
    ContractWideCollectionTopBidPrice: [
      {
        name: 'kind',
        type: 'uint8',
      },
      {
        name: 'twapSeconds',
        type: 'uint256',
      },
      {
        name: 'contract',
        type: 'address',
      },
    ],
  },
};

export async function generateDummyOracleMessage(
  collection: string,
  kind: OraclePriceType,
) {
  const signer = new ethers.Wallet(process.env.SIGNER_KEY!);

  const min = dummyOracleInfoMap[getAddress(collection)][0];
  const max = dummyOracleInfoMap[getAddress(collection)][1];
  const randomBetweenMinAndMax = Math.floor(
    Math.random() * (max - min + 1) + min,
  );

  const price = ethers.utils.parseUnits(
    randomBetweenMinAndMax.toString(),
    UNDERLYING_DECIMALS,
  );

  const id = _TypedDataEncoder.hashStruct(
    'ContractWideCollectionTopBidPrice',
    EIP712_TYPES.ContractWideCollectionTopBidPrice,
    {
      kind: Object.keys(OraclePriceType).indexOf(kind),
      twapSeconds: 604800,
      contract: collection,
    },
  );

  const payload = defaultAbiCoder.encode(
    ['address', 'uint256'],
    [UNDERLYING_ADDRESS, price],
  );

  const timestamp = Math.floor(new Date().getTime() / 1000 - 120);

  const signature = await signer.signMessage(
    arrayify(
      _TypedDataEncoder.hashStruct('Message', EIP712_TYPES.Message, {
        id,
        payload,
        timestamp,
      }),
    ),
  );

  const signedMessage: ReservoirResponseData = {
    price: parseFloat(ethers.utils.formatUnits(price, UNDERLYING_DECIMALS)),
    message: {
      id,
      payload,
      timestamp,
      signature,
    },
    data: '',
  };

  return signedMessage;
}
