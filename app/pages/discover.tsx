import { ShopPreview } from "../components/ShopPreview"
import { useShopList } from "../lib/contractHooks"
import Link from "next/link"
import { Button } from "../components/UIComp"

export default function Discover() {
  const { data: shopList, error: shopError } = useShopList()
  return (
    <div>
      <div className="text-2xl pl-28 mb-4 mt-24 text-gray-600 flex flex-row gap-4 items-center">
        All Shops
      </div>
      <div className="grid grid-cols-5 mt-8 px-24">
        {shopList?.map(shopInfo => (
          <Link href={`/shops/${shopInfo.handle}`} key={shopInfo.shopId}>
            <a><ShopPreview shopInfo={shopInfo} /></a>
          </Link>
        ))}
      </div>
    </div>
  )
}