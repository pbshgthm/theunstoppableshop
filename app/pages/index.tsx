import type { NextPage } from 'next'
import { useEvents, sendEther, sendLink, useLinkBalance } from '../lib/hooks'
import { useMetaMask } from "metamask-react"


function Login() {

  const { status, connect, account } = useMetaMask()

  if (status === "initializing")
    return <div>
      syncing metamask...
    </div>

  if (status === "unavailable")
    return <div>
      metaMask not available
    </div>

  if (status === "notConnected")
    return <button onClick={connect}>
      connect to metamask
    </button>

  if (status === "connecting")
    return <div>
      connecting...
    </div>

  if (status === "connected")
    return <div>
      connected account: {account}
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
      link Balance : {linkBalance}
      <br /><br /><br />
      <button onClick={() => { sendLink(ethereum) }}>send link</button>
      <br /><br /><br />
      <button onClick={() => { sendEther(ethereum) }}>send ether</button>
      <br /><br /><br />
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  ) 
}

export default Home