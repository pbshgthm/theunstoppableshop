import '../style.css'
import { MetaMaskProvider } from "metamask-react"

import type { AppProps } from 'next/app'

function App({ Component, pageProps }: AppProps) {
  return (
    <MetaMaskProvider>
      <Component {...pageProps} />
    </MetaMaskProvider >
  )
}

export default App
