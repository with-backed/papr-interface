import { SupportedToken } from 'lib/config';
import { tweet } from 'lib/events/consumers/twitter/api';
import { getTargetsInfo, getUniswapPoolInfo } from 'lib/updates/market';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { token } = req.query;
  const { target, targetPercentChange, apr } = await getTargetsInfo(
    token as SupportedToken,
  );
  const { mark, markPercentChange, volume24h } = await getUniswapPoolInfo(
    token as SupportedToken,
  );
  const marketUpdateTweet = formatTweet(
    target,
    targetPercentChange,
    mark,
    markPercentChange,
    volume24h,
    apr,
  );
  await tweet(marketUpdateTweet);

  return res.status(200).json({ success: true, tweet: marketUpdateTweet });
}

function formatTweet(
  target: string,
  targetPercentChange: string,
  mark: string,
  markPercentChange: string,
  volume24h: string,
  apr: string,
) {
  const action = target > mark ? 'raise' : 'lower';
  let baseString = `Status update: #paprMeme \n24h Uniswap trading volume: ${volume24h}\nContract is acting to ${action} market price\n\n`;
  if (target > mark) {
    baseString += `
    🍜  ←  Target price:  ${target} ETH (${targetPercentChange} 1hr)
    🔥
    🔥         Contract Rate: ${apr}
    🔥
    🧊  ←  Market price:  ${mark} ETH (${markPercentChange} 1hr)
    `;
  } else {
    baseString += `
    🔥  ←  Market price:  ${mark} ETH (${markPercentChange} 1hr)
    🧊
    🧊         Contract Rate: ${apr}
    🧊
    🍜  ←  Target price:  ${target} ETH (${targetPercentChange} 1hr)`;
  }
  return baseString;
}

export default handler;
