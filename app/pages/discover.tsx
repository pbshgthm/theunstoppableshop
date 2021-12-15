import { ShopPreview, ShopPreviewSkeleton } from "../components/ShopPreview"
import { useShopList } from "../lib/hooks"
import Link from "next/link"

export default function Discover() {
  const { data: shopList, error: shopError } = useShopList()

  return (
    <div className="mb-36">
      <div className="text-2xl ml-28 pl-2 mb-4 mt-24 text-gray-600 flex flex-row gap-4 items-center">
        All Shops
      </div>
      <div className="grid grid-cols-5 gap-12 mt-8 px-24">
        {Array(shopList ? 0 : 10).fill(0).map((_, index) => (
          <ShopPreviewSkeleton key={'shop-' + index} />
        ))}
        {shopList?.map(shopInfo => (
          <Link href={`/shops/${shopInfo.handle}`} key={'shop-' + shopInfo.shopId}>
            <a><ShopPreview shopInfo={shopInfo} /></a>
          </Link>
        ))}
      </div>
    </div>
  )
}