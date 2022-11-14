import { configs, SupportedToken, validateToken } from 'lib/config';
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
    validateToken(req.query);
    const { token, collection, kind } = req.query as {
      token: SupportedToken;
      collection: string;
      kind: string;
    };

    if (token === 'paprTrash') {
      return res
        .status(200)
        .json(await generateDummyOracleMessage(collection, configs[token]));
    } else {
      return res
        .status(200)
        .json(
          await getSignedOracleFloorPriceMessage(
            collection,
            configs[token],
            kind,
          ),
        );
    }
  } catch (e) {
    return res.status(400).json(null);
  }
}

export default handler;
