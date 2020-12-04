import Document, { Head, Html, Main, NextScript } from 'next/document'

const ga = process.env.NEXT_PUBLIC_GA

export default class _DocumentPage extends Document {
  render() {
    return (
      <Html>
        <Head>
          {ga && (
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            />
          )}
          {ga && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga}');
          `,
              }}
            />
          )}
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Source+Sans+Pro&display=swap"
            rel="stylesheet"
          />
          <link
            rel="alternate icon"
            type="image/png"
            href="/favicon-rounded-64w.png"
          />
          <link rel="icon" type="image/svg+xml" href="/favicon-rounded.svg" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
