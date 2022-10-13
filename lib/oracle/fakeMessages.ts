import { ethers } from 'ethers';
import {
  arrayify,
  defaultAbiCoder,
  getAddress,
  _TypedDataEncoder,
} from 'ethers/lib/utils';
import { Config } from 'lib/config';
import { ReservoirResponseData, USDC_DECIMALS } from './reservoir';

export const dummyOracleInfoMap = {
  [getAddress('0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e')]: '36.32',
  [getAddress('0x6ea6c63f60a1a99985c7acae03d7368b82785ca2')]: '1032.21',
  [getAddress('0x6ef2c9cb23f03014d18d7e4ceeaec497db00247c')]: '91.4',
  [getAddress('0x8232c5fd480c2a74d2f25d3362f262ff3511ce49')]: '10248.32',
  [getAddress('0x91036a17098a16a113fc0afe5967889e776eeee0')]: '234.21',
  [getAddress('0xb7d7fe7995d1e347916faae8e16cfd6dd21a9bae')]: '21.22',
};

const EIP712_TYPES = {
  Message: {
    Message: [
      { name: 'id', type: 'bytes32' },
      { name: 'payload', type: 'bytes' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  ContractWideCollectionPrice: {
    ContractWideCollectionPrice: [
      {
        name: 'kind',
        type: 'uint8',
      },
      {
        name: 'twapMinutes',
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
  config: Config,
) {
  const rpcProvider = new ethers.providers.JsonRpcProvider(
    config.jsonRpcProvider,
    config.chainId,
  );
  const signer = new ethers.Wallet(process.env.SIGNER_KEY!, rpcProvider);

  const price = ethers.utils.parseUnits(
    dummyOracleInfoMap[getAddress(collection)],
    USDC_DECIMALS,
  );

  const id = _TypedDataEncoder.hashStruct(
    'ContractWideCollectionPrice',
    EIP712_TYPES.ContractWideCollectionPrice,
    {
      kind: 1,
      twapMinutes: 43200,
      contract: collection,
    },
  );

  const payload = defaultAbiCoder.encode(
    ['address', 'uint256'],
    ['0x3089b47853df1b82877beef6d904a0ce98a12553', price],
  );
  const timestamp = await rpcProvider.getBlockNumber();

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
    price: parseFloat(ethers.utils.formatUnits(price, USDC_DECIMALS)),
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
