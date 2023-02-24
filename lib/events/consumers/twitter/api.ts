import { TwitterClient } from 'twitter-api-client';

export async function tweet(content: string) {
  const client = new TwitterClient({
    apiKey: process.env.TWITTER_API_KEY!,
    apiSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });

  await client.tweetsV2.createTweet({
    text: content,
  });
}
