import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log({ body: req.body });
  return res.status(200).json({ ok: true });
}

export default handler;
