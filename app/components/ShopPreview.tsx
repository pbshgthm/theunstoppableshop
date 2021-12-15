import { IShopDesc, IShopInfo } from "../lib/types"
import { trimHash, unPackIPFS } from "../lib/utils"
import Image from "next/image"
import { useState } from "react"
import useAsyncEffect from "use-async-effect"
import { useIPFS } from "../lib/hooks"
import { LibraryItem, LibraryItemSkeleton } from "./LibraryItem"

export function ShopPreview({ shopInfo }: {
  shopInfo: IShopInfo
}) {
  const { data: ipfsObject, error } = useIPFS(shopInfo.detailsCId)
  const [shopDesc, setShopDesc] = useState<IShopDesc>()
  const [logo, setLogo] = useState<string>()

  useAsyncEffect(async () => {
    if (ipfsObject) {
      const fileDict = await unPackIPFS(ipfsObject)
      const shopInfoJson = JSON.parse(await fileDict['shopDesc.json'].text()) as IShopDesc
      setShopDesc(shopInfoJson)

      const reader = new FileReader()
      reader.readAsDataURL(fileDict[shopInfoJson['logo']])
      reader.onload = () => {
        setLogo(reader.result as string)
      }
    }
  }, [ipfsObject])
  return (
    <div>
      {shopDesc
        ? <div className="flex flex-col hover:opacity-75 text-center gap-2 rounded-xl">
          <div>
            <Image src={logo || '/'} width={180} height={180} alt={shopDesc.name} className="rounded-xl" objectFit="cover" placeholder="blur" blurDataURL="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8+B8AAscB4jINlWEAAAAASUVORK5CYII=" />
          </div>
          <div className="mt-2 text-sm text-gray-500">@{shopInfo.handle}</div>
          <div className="text-xl text-gray-600">{shopDesc.name}</div>
          <div className="text-sm text-purple-800 font-mono">
            by {trimHash(shopInfo.owner)}
          </div>
          <div className="text-sm text-gray-500">
            {shopInfo.productsCount} products
          </div>
        </div>
        : <ShopPreviewSkeleton />
      }
    </div>
  )
}

export function ShopPreviewSkeleton() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-6">
      <div className="bg-gray-200 h-44 w-44 rounded-xl"></div>
      <div className="mt-4 w-24 h-2 bg-gray-200"></div>
      <div className="w-36 h-2 bg-gray-200"></div>
      <div className="w-12 h-2 bg-gray-200"></div>
    </div>
  )
}

export function ShopSkeleton() {
  return (
    <div className="absolute top-28 left-28 flex flex-row gap-48 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="bg-gray-200 h-56 w-56 rounded"></div>
        <div className="mt-6 w-24 h-4 bg-gray-200"></div>
        <div className="mt-4 w-36 h-8 bg-gray-200"></div>
        <div className="mt-6 w-24 h-4 bg-gray-200"></div>
        <div className="mt-16 w-36 h-8 bg-gray-200"></div>
      </div>
      <div className="pl-6">
        <div className="mt-2 w-64 h-8 bg-gray-200"></div>
        <div className="mt-8 w-96 h-4 bg-gray-200"></div>
        <div className="mt-2 w-96 h-4 bg-gray-200"></div>
        <div className="mt-2 w-96 h-4 bg-gray-200"></div>
        <div className="mt-2 w-36 h-4 bg-gray-200"></div>
        <div className="mt-8 mb-20 w-64 h-6 bg-gray-200"></div>
        <LibraryItemSkeleton />
      </div>
    </div>
  )
}