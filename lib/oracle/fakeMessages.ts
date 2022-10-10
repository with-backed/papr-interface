import { ethers } from 'ethers';
import {
  arrayify,
  defaultAbiCoder,
  formatBytes32String,
  getAddress,
  parseBytes32String,
  toUtf8Bytes,
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

function keccak256(arg: string) {
  const hexStr = ethers.utils.keccak256(arg);
  return Buffer.from(hexStr.slice(2, hexStr.length), 'hex');
}

export async function generateDummyOracleMessage(
  collection: string,
  config: Config,
) {
  const rpcProvider = new ethers.providers.JsonRpcProvider(
    config.jsonRpcProvider,
    config.chainId,
  );
  const price = ethers.utils.parseUnits(
    dummyOracleInfoMap[getAddress(collection)],
    USDC_DECIMALS,
  );

  const signer = new ethers.Wallet(process.env.SIGNER_KEY!, rpcProvider);
  const id = ethers.utils.hexZeroPad(
    ethers.utils.hexlify(ethers.utils.parseEther('3')),
    32,
  );
  const payload = defaultAbiCoder.encode(
    ['address', 'uint256'],
    [
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ethers.utils.parseEther('3'),
    ],
  );
  const timestamp = await rpcProvider.getBlockNumber();

  console.log({ payload });

  const EIP712_TYPES = {
    Message: {
      Message: [
        { name: 'id', type: 'bytes32' },
        { name: 'payload', type: 'bytes' },
        { name: 'timestamp', type: 'uint256' },
      ],
    },
  };

  const signature = await signer.signMessage(
    arrayify(
      _TypedDataEncoder.hashStruct('Message', EIP712_TYPES.Message, {
        id: '0x40a3a8affd14f3bed0a260ab13b9704476a51b99ebfe9e60ffe47dc4790e2629',
        payload,
        timestamp: 15685783,
      }),
    ),
  );

  const split = ethers.utils.splitSignature(signature);

  console.log({
    split,
  });

  console.log({
    signature,
    recovered: ethers.utils.verifyMessage(
      arrayify(
        _TypedDataEncoder.hashStruct('Message', EIP712_TYPES.Message, {
          id: '0x40a3a8affd14f3bed0a260ab13b9704476a51b99ebfe9e60ffe47dc4790e2629',
          payload,
          timestamp: 15685783,
        }),
      ),
      signature,
    ),
  });

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
