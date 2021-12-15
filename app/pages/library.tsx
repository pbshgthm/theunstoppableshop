import { useMetaMask } from "metamask-react"
import { LibraryItem, LibraryItemSkeleton } from "../components/LibraryItem"
import { useBuyerProducts } from "../lib/hooks"


export default function Library() {
  const { account } = useMetaMask()
  const { data: library, error: libraryError } = useBuyerProducts(account)
  console.log(library)
  return (
    <div className="mb-36">
      <div className="text-2xl pl-28 mb-4 mt-24 text-gray-600 flex flex-row gap-4 items-center">
        My Library
      </div>
      {
        (library?.length === 0) &&
        <div>
          <div className="text-sm ml-28 mt-12 text-purple-800">
            {"You haven't bought any product yet."}
          </div>
        </div>
      }
      <div className="grid grid-cols-3 mt-8 mb-24 pl-28">
        {Array(library === undefined ? 6 : 0).fill(0).map((_, index) => (
          <LibraryItemSkeleton key={'libsk-' + index} />
        ))}
        {library && library.map(({ sale, product, shop }, i) => (
          <LibraryItem key={`lib-${sale.saleId}-${product.productId}-${shop.shopId}`} shopInfo={shop} productInfo={product} saleInfo={sale} />
        ))}
      </div>
    </div>
  )
}