import React from "react"
import Link from "next/link"
import { ConnectMetamask } from "./ConnectMetamask"
import Image from "next/image"
import { useRouter } from "next/router"


const navUrls = [
  ['/discover', 'Discover'],
  ['/myshops', 'My Shops'],
  ['/library', 'Library']
]

export function Header() {
  const router = useRouter()
  return (
    <div className="bg-white w-full h-14 shadow-sm flex flex-row items-center px-4 justify-between fixed top-0 z-40">
      <Link href="/">
        <a><Image src="/assets/logo.png" width={240} height={24} alt="Logo" /></a>
      </Link>
      <div className="flex flex-row items-center gap-12">
        <div className={`flex flex-row gap-12 text-sm`}>
          {navUrls.map(([url, text]) => (
            <Link href={url} key={url}>
              <a><div className={`${router.asPath.includes(url) ? 'text-purple-800' : 'text-gray-500'} hover:text-purple-800`}>{text}</div></a>
            </Link>
          ))}
        </div>
        <ConnectMetamask />
      </div>
    </div>
  )
}