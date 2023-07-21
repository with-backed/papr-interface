import { WebhookRequestBody } from 'lib/goldsky/webhooks';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestBody = req.body as WebhookRequestBody;
  console.log({
    data: requestBody.data.new,
  });
  return res.status(200).json({ ok: true });
}

export default handler;
