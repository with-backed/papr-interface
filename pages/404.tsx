import { Custom404 } from 'components/Custom404';
import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>Papr | 404</title>
        <meta name="description" content="Something went wrong" />
      </Head>
      <Custom404 />
    </>
  );
}
