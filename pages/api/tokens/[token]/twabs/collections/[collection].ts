import { configs, SupportedToken, validateToken } from 'lib/config';
import { clientFromUrl } from 'lib/urql';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  LatestTwabForCollectionBeforeTimeDocument,
  LatestTwabForCollectionBeforeTimeQuery,
} from 'types/generated/graphql/twabs';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LatestTwabForCollectionBeforeTimeQuery | null>,
) {
  try {
    validateToken(req.query);
    const { token, collection } = req.query as {
      token: SupportedToken;
      collection: string;
    };
    const config = configs[token];
    const client = clientFromUrl(config.twabsApi);
    const now = new Date();
    const twentyFourHoursAgo = new Date(
      (now.getTime() / 1000 - 24 * 60 * 60) * 1000,
    ).toISOString();
    const { data, error } = await client
      .query<LatestTwabForCollectionBeforeTimeQuery>(
        LatestTwabForCollectionBeforeTimeDocument,
        {
          collection: collection.toLowerCase(),
          earlierThan: twentyFourHoursAgo,
        },
        {
          fetchOptions: {
            headers: {
              'content-type': 'application/json',
              'x-hasura-admin-secret':
                process.env.NEXT_PUBLIC_TWABS_GRAPHQL_TOKEN!,
            },
            method: 'POST',
          },
        },
      )
      .toPromise();

    if (error || !data) {
      return res.status(400).json(null);
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json(null);
  }
}

export default handler;
