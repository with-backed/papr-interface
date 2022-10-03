import { configs, SupportedNetwork, validateNetwork } from 'lib/config';
import { generateDummyOracleMessage } from 'lib/oracle/fakeMessages';
import {
  getSignedOracleFloorPriceMessage,
  ReservoirResponseData,
} from 'lib/oracle/reservoir';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReservoirResponseData | null>,
) {
  try {
    validateNetwork(req.query);
    const { network, collection } = req.query as {
      network: SupportedNetwork;
      collection: string;
    };
    if (network === 'goerli') {
      return res
        .status(200)
        .json(await generateDummyOracleMessage(collection, configs[network]));
    } else {
      return res
        .status(200)
        .json(await getSignedOracleFloorPriceMessage(collection));
    }
  } catch (e) {
    return res.status(400).json(null);
  }
}

export default handler;
