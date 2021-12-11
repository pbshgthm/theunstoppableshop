import { ShopPreview } from "../components/ShopPreview"

const shop = {
  name: 'Milkyway Galaxy',
  image: 'shop.png',
  tags: ['Music', 'Books'],
  owner: '0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515'
}
const shopList = Array(25).fill(shop)

export default function Index() {
  return (
    <div className="grid grid-cols-5 gap-4 w-[1200px] m-auto my-12">
      {shopList.map(shop => (<ShopPreview shop={shop} key={shop.name} />))}
    </div>
  )
}