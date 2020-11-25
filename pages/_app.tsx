import type { AppProps } from 'next/app'

import '../styles/index.css'

function _AppPage({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default _AppPage
