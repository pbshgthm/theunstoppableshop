import React from "react"
import Link from "next/link"
import { ConnectMetamask } from "./ConnectMetamask"
import Image from "next/image"


const navUrls = [
  ['/shops', 'Discover'],
  ['/myshops', 'My Shops'],
  ['/', 'Library']
]

export function Header() {
  return (
    <div className="bg-white w-full h-14 shadow-sm flex flex-row items-center px-4 justify-between">
      <Image src="/assets/logo.png" width={240} height={24} alt="Metamask" />
      <div className="flex flex-row items-center gap-12">
        <div className="flex flex-row gap-12 text-gray-600 text-sm">
          {navUrls.map(([url, text]) => (
            <Link href={url} key={url}>
              <a>{text}</a>
            </Link>
          ))}
        </div>
        <ConnectMetamask />
      </div>
    </div>
  )
}