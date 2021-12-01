import type { NextPage } from 'next'
import { useEvents, sendMoney, useLinkBalance } from '../lib/hooks'
import { useMetaMask } from "metamask-react"


function Login() {

  const { status, connect, account } = useMetaMask()

  if (status === "initializing")
    return <div>
      Synchronisation with MetaMask ongoing...
    </div>

  if (status === "unavailable")
    return <div>
      MetaMask not available
    </div>

  if (status === "notConnected")
    return <button onClick={connect}>
      Connect to MetaMask
    </button>

  if (status === "connecting")
    return <div>
      Connecting...
    </div>

  if (status === "connected")
    return <div>
      Connected account: {account}
    </div>

  return null
}


const Home: NextPage = () => {
  const { status, connect, account, ethereum } = useMetaMask()
  const { data: linkBalance } = useLinkBalance(account || "")
  const { data: events } = useEvents(account || '')

  return (
    <div>
      <Login />
      <br /><br />
      Link Balance : {linkBalance}
      <br /><br /><br />
      <button onClick={() => { sendMoney(ethereum) }}>send money</button>
      <br /><br /><br />
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  )
}

export default Home
