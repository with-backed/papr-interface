import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import {
  BUNNY_IMG_URL_MAP,
  OPENGRAPH_DEFAULT_DESCRIPTION,
} from 'lib/constants';
import Head from 'next/head';
import { useRouter } from 'next/router';

type OpenGraphProps = {
  imageUrl?: string;
  title: string;
  type?: 'website' | 'profile';
  description?: string;
};

export function OpenGraph({
  imageUrl,
  title,
  type = 'website',
  description = OPENGRAPH_DEFAULT_DESCRIPTION,
}: OpenGraphProps) {
  const { siteUrl, network } = useConfig();
  const { pathname } = useRouter();
  let img = imageUrl || BUNNY_IMG_URL_MAP[network as SupportedNetwork];
  return (
    <Head>
      <meta property="og:title" content={title} />
      <meta property="twitter:title" content={title} />
      <title>{title}</title>
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl + pathname} />
      <meta property="twitter:url" content={siteUrl + pathname} />
      <meta property="og:image" content={img} />
      <meta property="twitter:image" content={img} />
      {!!description && (
        <>
          <meta property="og:description" content={description} />
          <meta name="twitter:description" content={description} />
          <meta name="description" content={description} />
        </>
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="backed_xyz" />
    </Head>
  );
}
