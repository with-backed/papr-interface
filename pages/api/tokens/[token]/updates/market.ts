import { SupportedToken } from 'lib/config';
import { getTargetsInfo, getUniswapPoolInfo } from 'lib/updates/market';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { token } = req.query;
  const { currentTarget, targetHourAgo, targetPercentChange, apr } =
    await getTargetsInfo(token as SupportedToken);
  const { mark, markPercentChange, volume24h } = await getUniswapPoolInfo(
    token as SupportedToken,
  );
  const marketUpdateTweet = formatTweet(
    currentTarget,
    targetPercentChange,
    mark,
    markPercentChange,
    volume24h,
    apr,
  );
  // await tweet(marketUpdateTweet); // TODO(adamgobes): uncomment this when we're ready to tweet

  return res.status(200).json({ success: true, tweet: marketUpdateTweet });
}

function formatTweet(
  currentTarget: number,
  targetPercentChange: string,
  mark: number,
  markPercentChange: string,
  volume24h: string,
  apr: string,
) {
  const action = currentTarget > mark ? 'raise' : 'lower';
  let baseString = `Status update: #paprMeme \n24h Uniswap trading volume: ${volume24h}\nContract is acting to ${action} market price\n\n`;
  if (currentTarget > mark) {
    baseString += `
    🍜  ←  Target price:  ${currentTarget} ETH
    🔥
    🔥     Contract Rate: ${apr}
    🔥
    🧊  ←  Market price:  ${mark} ETH
    `;
  } else {
    baseString += `
    🔥  ←  Market price:  ${mark} ETH
    🧊
    🧊     Contract Rate: ${apr}
    🧊
    🍜  ←  Target price:  ${currentTarget} ETH
    `;
  }
  return baseString;
}

export default handler;
