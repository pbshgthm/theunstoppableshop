import { useMetaMask } from "metamask-react"
import Link from "next/link"
import { LibraryItem } from "../components/LibraryItem"
import { useBuyerProducts } from "../lib/contractHooks"


export default function Library() {
  const { account } = useMetaMask()
  const { data: library, error: libraryError } = useBuyerProducts(account)

  return (
    <div>
      <div className="text-2xl pl-28 mb-4 mt-24 text-gray-600 flex flex-row gap-4 items-center">
        My Library
      </div>
      <div className="grid grid-cols-3 mt-8 mb-24 pl-28">
        {library && library.map(({ sale, product, shop }, i) => (
          <LibraryItem key={'lib-' + i} shopInfo={shop} productInfo={product} saleInfo={sale} />
        ))}
      </div>
    </div>
  )
}