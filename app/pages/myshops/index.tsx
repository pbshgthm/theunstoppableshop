import { useMetaMask } from 'metamask-react'
import Link from 'next/link'
import { ShopPreview } from '../../components/ShopPreview'
import { Button } from '../../components/UIComp'
import { useOwnerShopList } from '../../lib/contractHooks'

export default function MyShops() {
  const { account } = useMetaMask()
  const { data: shopList, error: shopError } = useOwnerShopList(account)
  return (
    <div>
      <div className="text-2xl pl-28 mb-4 mt-24 text-gray-600 flex flex-row gap-4 items-center">
        My Shops
        <Link href="/myshops/create">
          <a><Button text='Create Shop' isPrimary={true} /></a>
        </Link>
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