import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          defer
          type="text/javascript"
          src="https://api.pirsch.io/pirsch.js"
          id="pirschjs"
          key="pirschjs"
          data-code={process.env.NEXT_PUBLIC_PIRSCH_CODE}></script>
        <script
          defer
          type="text/javascript"
          src="https://api.pirsch.io/pirsch-events.js"
          id="pirscheventsjs"
          key="pirscheventsjs"
          data-code={process.env.NEXT_PUBLIC_PIRSCH_CODE}></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
