import { strArrayToPhrase, trimHash } from "../lib/utils"

export function ShopPreview({ shop }: { shop: any }) {
  return (
    <div className="flex flex-col hover:bg-purple-50 p-4 text-center gap-4 rounded-xl">
      <div>
        <img src={`/assets/template/${shop.image}`} width={180} height={180} alt={shop.name} className="rounded-xl" />
      </div>
      <div className="text-xl text-gray-600">{shop.name}</div>
      <div className="text-sm text-gray-500 font-mono">by {trimHash(shop.owner)}</div>
      <div className="text-sm text-purple-800">{strArrayToPhrase(shop.tags)}</div>
    </div>
  )
}