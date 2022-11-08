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
    const { network, collection, heroes } = req.query as {
      network: SupportedNetwork;
      collection: string;
      heroes: string;
    };
    const isHeroes = heroes === 'true';

    if (network === 'ethereum' || isHeroes) {
      return res
        .status(200)
        .json(
          await getSignedOracleFloorPriceMessage(
            collection,
            configs[network],
            isHeroes,
          ),
        );
    } else {
      return res
        .status(200)
        .json(await generateDummyOracleMessage(collection, configs[network]));
    }
  } catch (e) {
    return res.status(400).json(null);
  }
}

export default handler;
