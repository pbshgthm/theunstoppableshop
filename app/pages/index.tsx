import { error } from "console"
import { ShopPreview } from "../components/ShopPreview"
import { useShopList } from "../lib/contractHooks"
import Link from "next/link"

const shop = {
  name: 'Milkyway Galaxy',
  image: 'shop.png',
  tags: ['Music', 'Books'],
  owner: '0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515'
}
const shopList = Array(25).fill(shop)

export default function Index() {
  const { data: shopList, error: shopError } = useShopList()
  return (
    <div className="p-20">
      {shopList?.map(shop => (
        <Link href={`/shops/${shop.handle}`} key={shop.shopId}>
          <a>
            <div>
              {shop.shopId} . {shop.handle}
            </div>
          </a>
        </Link>
      ))}
    </div>
  )
}