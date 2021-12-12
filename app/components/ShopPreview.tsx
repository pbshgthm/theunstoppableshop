import { IShopDesc, IShopInfo } from "../lib/types"
import { trimHash, unPackIPFS } from "../lib/utils"
import Image from "next/image"
import { useState } from "react"
import { useIPFS } from "../lib/miscHooks"
import useAsyncEffect from "use-async-effect"

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
      {shopDesc && (
        <div className="flex flex-col hover:bg-purple-50 p-4 text-center gap-4 rounded-xl">
          <div>
            {logo && <Image src={logo} width={180} height={180} alt={shopDesc.name} className="rounded-xl" />}
          </div>
          <div className="text-xl text-gray-600">{shopDesc.name}</div>
          <div className="text-sm text-gray-500 font-mono">
            by {trimHash(shopInfo.owner)}
          </div>
          <div className="text-sm text-purple-800">
            {shopInfo.productsCount} products
          </div>
        </div>
      )}
    </div>
  )
}