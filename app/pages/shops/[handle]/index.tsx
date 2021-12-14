import { trimHash, unPackIPFS } from "../../../lib/utils"
import Image from "next/image"
import { useEffect, useState } from "react"
import useAsyncEffect from "use-async-effect"
import { IShopDesc } from "../../../lib/types"
import { useIPFS, useProductList, useShop, useShopId } from "../../../lib/hooks"
import { useRouter } from "next/router"
import { Button } from "../../../components/UIComp"
import Link from "next/link"
import { useMetaMask } from "metamask-react"
import { ProductPreview } from "../../../components/ProductPreview"


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
  const { data: shopId, error: shopIdError } = useShopId(handle as string)
  const { data: shopInfo, error: shopInfoError } = useShop(shopId)
  const [detailsCID, setDetailsCID] = useState<string>()
  const { data: ipfsObject, error } = useIPFS(detailsCID)
  const { data: productList, error: productListError } = useProductList(shopId)
  const { account } = useMetaMask()

  const [logo, setLogo] = useState<string>()
  const [shopDesc, setShopDesc] = useState<IShopDesc>()

  useEffect(() => {
    if (shopInfo && shopInfo.detailsCId) {
      setDetailsCID(shopInfo.detailsCId)
    }
  }, [shopInfo])

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
      {shopDesc && shopInfo && (
        <div>
          <div className="flex flex-col p-4 text-center gap-3 rounded-xl w-64 fixed left-24 top-24">
            {logo && <Image src={logo as string} width={232} height={232} alt={''} className="rounded-xl mb-2" objectFit="cover" />}
            <div className="flex flex-col gap-2">
              <div className="mt-2 text-sm text-gray-400">@{shopInfo.handle}</div>
              <div className="text-2xl text-gray-600 font-light">
                {shopDesc.name}
              </div>
              <div className="text-sm text-gray-500 font-mono">by {trimHash(shopInfo.owner)}</div>
            </div>
            <div className="flex flex-col mt-4">
              {shopInfo && <div className="text-gray-500">{shopDesc.website}</div>}
              <div className="flex flex-row gap-3 self-center mt-3" >
                {shopDesc.discord &&
                  <SocialIcon name="discord" link={shopDesc.discord} />}
                {shopDesc.twitter &&
                  <SocialIcon name="twitter" link={shopDesc.twitter} />}
                {shopDesc.youtube &&
                  <SocialIcon name="youtube" link={shopDesc.youtube} />}
                {shopDesc.spotify &&
                  <SocialIcon name="spotify" link={shopDesc.spotify} />}
              </div>
            </div>
            <div className="my-4">
              <div className="text-2xl text-purple-800 my-1">
                {productList?.reduce((acc, cur) => acc + cur.totalRevenue, 0).toFixed(6)}
              </div>
              <div className="text-sm text-gray-500 my-1">MATIC earned from</div>
              <div className="text-sm text-purple-800 my-1">
                {shopInfo.salesCount} sales
              </div>
            </div>
            {(shopInfo.owner.toLowerCase() === account?.toLocaleLowerCase()) &&
              <div className="flex flex-row gap-2 self-center mt-4">
                <Link href={`/shops/${handle}/add`}>
                  <a>
                    <Button text="Add product" isPrimary={true} />
                  </a>
                </Link>
              </div>
            }
          </div>
          <div className="ml-[550px] w-[550px] mt-28">
            <div className="text-2xl text-gray-600 font-light">
              {shopDesc.tagline}
            </div>
            <div className="text-sm text-gray-600 w-[550px] mt-4 leading-6">
              {shopDesc.description}
            </div>
            <div className="my-12">
              <div className="text-gray-500 text-sm">
                Revenue from this shop is shared with
              </div>
              <div className="font-mono text-sm text-purple-800 mt-3">
                {shopInfo.benificiaries.map((ben, i) => (
                  <div key={'ben-' + i} className="inline-block">
                    {trimHash(ben.address)}
                    <span className="font-medium ml-1 mr-8 text-gray-600">
                      {ben.share}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xl text-orange-800 flex flex-row items-center">
              Products
              <div className="ml-4 mt-1 w-56 h-[1px] bg-orange-800"></div>
            </div>
            <div className="flex flex-col gap-12 my-12">
              {productList && productList.reverse().map((productInfo, i) => (
                <Link href={`/shops/${handle}/product-${productInfo.productId}`} key={`prd-${productInfo.productId}`}>
                  <a><ProductPreview productInfo={productInfo} /></a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {!shopDesc}
    </div>
  )
}