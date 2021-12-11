import { trimHash, unPackIPFS } from "../../../lib/utils"
import { useIPFS } from "../../../lib/miscHooks"
import Image from "next/image"
import { useEffect, useState } from "react"
import useAsyncEffect from "use-async-effect"
import { IShopInfo } from "../../../lib/types"
import { useShop, useShopNameToId } from "../../../lib/shopHooks"
import { useRouter } from "next/router"
import { Button } from "../../../components/UIComp"


function SocialIcon({ name, link }: { name: string, link: string }) {
  return (
    <a href={link}>
      <Image
        src={`/assets/${name}.png`}
        width={28}
        height={28}
        alt={name}
        className="opacity-75 hover:opacity-60"
      />
    </a>
  )
}

export default function Shop() {
  const router = useRouter()

  const { handle } = router.query
  const { data: shopId, error: shopIdError } = useShopNameToId(handle as string)
  const { data: shop, error: shopError } = useShop(shopId)
  const [detailsCID, setDetailsCID] = useState<string>()
  const { data: ipfsObject, error } = useIPFS(detailsCID)

  console.log(shopId, shop, shopIdError, shopError)
  const [logo, setLogo] = useState<string>()
  const [shopInfo, setShopInfo] = useState<IShopInfo>()

  useEffect(() => {
    if (shop) {
      setDetailsCID(shop.detailsCId)
    }
  }, [shop])

  useAsyncEffect(async () => {
    if (ipfsObject) {
      const fileDict = await unPackIPFS(ipfsObject)
      const shopInfoJson = JSON.parse(await fileDict['shopInfo.json'].text()) as IShopInfo
      setShopInfo(shopInfoJson)

      const reader = new FileReader()
      reader.readAsDataURL(fileDict[shopInfoJson['logo']])
      reader.onload = () => {
        setLogo(reader.result as string)
        console.log(reader.result)
      }
    }
  }, [ipfsObject])

  return (
    <div>
      {shopInfo && (
        <div>
          <div className="flex flex-col p-4 text-center gap-3 rounded-xl w-64 fixed left-24 top-24">
            {logo && <Image src={logo as string} width={232} height={232} alt={''} className="rounded-xl mb-2" objectFit="cover" />}
            <div className="flex flex-col gap-2">
              <div className="text-2xl text-gray-600 font-light">
                {shopInfo.name}
              </div>
              <div className="text-sm text-gray-500 font-mono">by {trimHash(shopInfo.owner)}</div>
            </div>
            <div className="flex flex-col mt-4">
              {shopInfo && <div className="text-gray-500">{shopInfo.website}</div>}
              <div className="flex flex-row gap-3 self-center mt-3" >
                {shopInfo.discord &&
                  <SocialIcon name="discord" link={shopInfo.discord} />}
                {shopInfo.twitter &&
                  <SocialIcon name="twitter" link={shopInfo.twitter} />}
                {shopInfo.youtube &&
                  <SocialIcon name="youtube" link={shopInfo.youtube} />}
                {shopInfo.spotify &&
                  <SocialIcon name="spotify" link={shopInfo.spotify} />}
              </div>
            </div>
            <div className="my-4">
              <div className="text-2xl text-purple-800 my-1">{122}</div>
              <div className="text-sm text-gray-500 my-1">MATIC earned from</div>
              <div className="text-sm text-purple-800 my-1">2345 sales</div>
            </div>
            <div className="flex flex-row gap-2 self-center mt-4">
              <Button text="Edit Shop" />
              <Button text="Add product" isPrimary={true} />
            </div>
          </div>
          <div className="ml-[550px] mt-12 w-[550px]">
            <div className="text-2xl text-gray-600 font-light">
              {shopInfo.tagline}
            </div>
            <div className="text-sm text-gray-600 w-[550px] mt-4 leading-6">
              {shopInfo.description}
            </div>
            <div className="my-8">
              <div className="text-gray-400 text-sm">Revenue from this shop is shared with</div>
              <div className="font-mono text-sm text-gray-500 my-2">
                {shopInfo.benificiaries.map((ben, i) => (
                  <div key={'ben-' + i} className="inline-block">
                    {trimHash(ben.address)}
                    <span className="font-medium ml-1 mr-8">{ben.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {!shopInfo && <div>Loading...</div>}
    </div>
  )
}