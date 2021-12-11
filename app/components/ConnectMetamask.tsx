import { useMetaMask } from "metamask-react"
import { useEffect, useState } from "react"
import { trimHash } from "../lib/utils"
import Image from 'next/image'


const statusMessage = {
  'initializing': 'SYNCING',
  'unavailable': 'INSTALL METAMASK',
  'notConnected': 'CONNECT',
  'connecting': 'CONNECTING'
}

export function ConnectMetamask() {

  const { status, connect, account } = useMetaMask()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (status === 'connected') {
      setMessage(trimHash(account as string))
    } else {
      setMessage(statusMessage[status])
    }

  }, [status, account])

  return (
    <button onClick={connect} className="text-xs px-4 rounded-full bg-orange-100 text-orange-700 flex flex-row gap-2 h-9 items-center font-mono">
      {message}
      <Image src="/assets/metamask.png" width={18} height={18} alt="Metamask" />
    </button>
  )
}