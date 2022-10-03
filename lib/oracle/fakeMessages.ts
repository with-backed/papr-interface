import { ethers } from 'ethers';
import { Config } from 'lib/config';
import { ReservoirResponseData, USDC_DECIMALS } from './reservoir';

export async function generateDummyOracleMessage(
  collection: string,
  config: Config,
) {
  const rpcProvider = new ethers.providers.JsonRpcProvider(
    config.jsonRpcProvider,
    config.chainId,
  );

  const price = ethers.utils.parseUnits('2078.49', USDC_DECIMALS);
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
