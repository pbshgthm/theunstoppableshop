import { useState } from "react"
import useAsyncEffect from "use-async-effect"
import { IProductDesc, IProductInfo, ISaleInfo, IShopInfo } from "../lib/types"
import { decryptFile, effectivePrice, toDateString, trimHash, trimString, unPackIPFS } from "../lib/utils"
import Image from "next/image"
import { Button } from "./UIComp"
import Link from "next/link"
import { useMetaMask } from "metamask-react"
import saveAs from "file-saver"
import { useGuild, useIPFS } from "../lib/hooks"

export function LibraryItem({ productInfo, saleInfo, shopInfo }: {
  productInfo: IProductInfo,
  saleInfo: ISaleInfo,
  shopInfo: IShopInfo
}) {

  const { account, ethereum } = useMetaMask()
  const { data: guildInfo, error: guildInfoError } = useGuild()
  const { data: descIPFS, error: descIPFSError } = useIPFS(productInfo?.detailsCID)
  const { data: filesIPFS, error: filesIPFSError } = useIPFS(productInfo?.contentCID)
  const [productDesc, setProductDesc] = useState<IProductDesc>()
  const [previewStr, setPreviewStr] = useState<string[]>()

  async function downloadFile() {
    if (filesIPFS) {
      const license = await ethereum.request({
        method: 'eth_decrypt',
        params: [saleInfo.unlockedLicense, account]
      })
      const decrypted = await decryptFile(filesIPFS, license)
      saveAs(decrypted, `${productDesc?.name}.zip`)
    }
  }
  useAsyncEffect(async () => {
    if (descIPFS) {
      const descFileDict = await unPackIPFS(descIPFS)
      const productDescJson = JSON.parse(await descFileDict['productDesc.json'].text()) as IProductDesc
      setProductDesc(productDescJson)

      Promise.all(productDescJson.preview.map(fileName => {
        return (new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(descFileDict[fileName])
        }))
      })).then(previewStr => {
        setPreviewStr(previewStr as string[])
      })
    }
  }, [descIPFS])

  return (
    <div>
      {descIPFS && filesIPFS && guildInfo &&
        <div className="flex flex-row gap-4 my-8">
          {previewStr && <Image src={previewStr[0]} width={150} height={200} objectFit="cover" alt="" className="rounded-xl shadow-2xl" />}
          <div className="flex flex-col">
            <div className="text-lg text-gray-600">
              {trimString(productDesc?.name, 15)}
            </div>
            <div className="text-gray-500 text-sm">
              @{trimString(shopInfo.handle, 10)} by
              <span className="ml-2 font-mono text-xs">{trimHash(shopInfo.owner)}</span>
            </div>
            <div className="text-gray-500 text-sm mt-4">
              {effectivePrice(productInfo.price, guildInfo.ratingReward, guildInfo.serviceTax)} MATIC
            </div>
            <div className="text-gray-400 text-sm mt-1">
              Bought on {toDateString(saleInfo.saleDeadline).slice(0, -8)}
            </div>
            <div className="flex flex-row gap-2 mt-4">
              <Button text="Download" onClick={downloadFile} />
              <Link href={`shops/${shopInfo.handle}/${productInfo.productId}`}>
                <a><Button text="View" isOutline={false} /></a>
              </Link>
            </div>
          </div>
        </div>}
    </div >
  )
}
