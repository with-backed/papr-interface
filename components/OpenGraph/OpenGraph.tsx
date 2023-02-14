import { useConfig } from 'hooks/useConfig';
import { OPENGRAPH_DEFAULT_DESCRIPTION } from 'lib/constants';
import Head from 'next/head';
import { useRouter } from 'next/router';

type OpenGraphProps = {
  title: string;
  type?: 'website' | 'profile';
};

export function OpenGraph({ title, type = 'website' }: OpenGraphProps) {
  const { siteUrl } = useConfig();
  const { pathname } = useRouter();
  const img = '/logos/graph-bunny.png';
  const description = OPENGRAPH_DEFAULT_DESCRIPTION;
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
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="backed_xyz" />
    </Head>
  );
}
