import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers/node_modules/@ethersproject/providers';
import { Config } from 'lib/config';
import { ReservoirResponseData } from './reservoir';

export async function generateDummyOracleMessage(
  collection: string,
  config: Config,
) {
  const rpcProvider = new JsonRpcProvider(
    config.jsonRpcProvider,
    config.chainId,
  );

  const price = ethers.utils.parseEther('2078.49');
  const signer = new ethers.Wallet(process.env.SIGNER_KEY!, rpcProvider);
  const id = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
  const payload = ethers.utils.hexlify(price);
  const timestamp = await rpcProvider.getBlockNumber();

  const signature = await signer.signMessage(
    ethers.utils.defaultAbiCoder.encode(
      ['tuple(bytes32 id,bytes payload,uint256 timestamp)'],
      [{ id, payload, timestamp }],
    ),
  );

  const signedMessage: ReservoirResponseData = {
    price: parseFloat(ethers.utils.formatEther(price)),
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
