import '../style.css'
import { MetaMaskProvider } from "metamask-react"
import type { AppProps } from 'next/app'
import { Header } from '../components/Header'
import { Background } from '../components/UIComp'

function App({ Component, pageProps }: AppProps) {
  return (
    <MetaMaskProvider>
      <Header />
      <Component {...pageProps} />
    </MetaMaskProvider >
  )
}

export default App
