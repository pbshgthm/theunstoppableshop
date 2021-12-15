import { useMetaMask } from 'metamask-react'
import Link from 'next/link'
import { ShopPreview, ShopPreviewSkeleton } from '../../components/ShopPreview'
import { Button } from '../../components/UIComp'
import { useOwnerShopList } from '../../lib/hooks'

export default function MyShops() {
  const { account } = useMetaMask()
  const { data: shopList, error: shopError } = useOwnerShopList(account)
  return (
    <div>
      <div className="text-2xl ml-28 mb-4 mt-24 text-gray-600 flex flex-row gap-4 items-center">
        My Shops
        <Link href="/myshops/create">
          <a><Button text='Create Shop' isPrimary={true} /></a>
        </Link>
      </div>
      {
        (shopList?.length === 0) &&
        <div>
          <div className="text-sm text-purple-800 ml-28">
            {"You haven't created any shop yet."}
          </div>
        </div>
      }
      <div className="grid grid-cols-5 gap-12 mt-8 px-24">
        {Array(shopList ? 0 : 10).fill(0).map((_, index) => (
          <ShopPreviewSkeleton key={'shop-' + index} />
        ))}
        {shopList?.map(shopInfo => (
          <Link href={`/shops/${shopInfo.handle}`} key={shopInfo.shopId}>
            <a><ShopPreview shopInfo={shopInfo} /></a>
          </Link>
        ))}
      </div>
    </div>
  )
}