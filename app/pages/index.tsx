import { error } from "console"
import { ShopPreview } from "../components/ShopPreview"
import { useShopList } from "../lib/contractHooks"
import Link from "next/link"



export default function Index() {
  const { data: shopList, error: shopError } = useShopList()
  return (
    <div className="grid grid-cols-5  mt-12 ml-12">
      {shopList?.map(shopInfo => (
        <Link href={`/shops/${shopInfo.handle}`} key={shopInfo.shopId}>
          <a><ShopPreview shopInfo={shopInfo} /></a>
        </Link>
      ))}
    </div>
  )
}