import { useState } from "react"
import useAsyncEffect from "use-async-effect"
import { useIPFS } from "../lib/miscHooks"
import { IProductDesc, IProductInfo } from "../lib/types"
import { toDateString, unPackIPFS } from "../lib/utils"
import Image from "next/image"

export function ProductPreview({ productInfo }: {
  productInfo: IProductInfo
}) {

  const { data: descIPFS, error: descIPFSError } = useIPFS(productInfo?.detailsCID)
  const [productDesc, setProductDesc] = useState<IProductDesc>()
  const [previewStr, setPreviewStr] = useState<string[]>()

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
    <div className="flex flex-row gap-4">
      {previewStr && <Image src={previewStr[0]} width={150} height={200} objectFit="cover" alt="" className="rounded-xl" />}
      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          <div className="text-lg text-gray-600">{productDesc?.name}</div>
          <div className="text-gray-400 text-sm">{productInfo.price} MATIC</div>
          <div className="text-sm text-gray-500 leading-6">
            {productDesc?.description.slice(0, 140)}
          </div>
        </div>
        <div className="mb-2">
          {(productInfo.stock < 4294967295)
            ?
            <div className="mb-0.5">
              <span className="text-sm text-purple-800">LIMITED EDITION</span>
              <span className="text-gray-500 text-sm ml-4">
                {productInfo.stock - productInfo.salesCount} of {productInfo.stock} Available
              </span>
            </div>
            :
            <span className="text-gray-500 text-sm mr-4">
              {productInfo.salesCount} Sold
            </span>
          }
          <span className="text-gray-400 text-sm">
            Listed on {toDateString(productInfo.creationTime, true)}
          </span>
        </div>
      </div>
    </div>
  )
}