import { useState } from "react"
import useAsyncEffect from "use-async-effect"
import { IProductDesc, IProductInfo } from "../lib/types"
import { effectivePrice, toDateString, unPackIPFS } from "../lib/utils"
import Image from "next/image"
import { useGuild, useIPFS } from "../lib/hooks"
import { LibraryItemSkeleton } from "./LibraryItem"

export function ProductPreview({ productInfo }: {
  productInfo: IProductInfo
}) {

  const { data: descIPFS, error: descIPFSError } = useIPFS(productInfo?.detailsCID)
  const { data: guildInfo, error: guildInfoError } = useGuild()
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
    (productDesc && guildInfo)
      ? <div className="flex flex-row gap-4">
        <Image src={previewStr?.at(0) || '/'} width={150} height={200} objectFit="cover" alt="" className="rounded-xl" placeholder="blur" blurDataURL="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8+B8AAscB4jINlWEAAAAASUVORK5CYII=" />
        <div className="flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="text-lg text-gray-600">{productDesc?.name}</div>
            <div className="text-gray-500 text-sm">{effectivePrice(productInfo.price, guildInfo.ratingReward, guildInfo.serviceTax)} MATIC</div>
            <div className="text-sm text-gray-500 leading-6 w-[400px]">
              {productDesc?.description.slice(0, 80)}...
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
            <span className="text-gray-500 text-sm">
              Listed on {toDateString(productInfo.creationTime, true)}
            </span>
          </div>
        </div>
      </div>
      : <LibraryItemSkeleton />
  )
}

export function ProductSkeleton() {
  return (
    <div className="absolute top-24 left-36 animate-pulse">
      <div className="flex flex-row gap-24">
        <div className="w-[450px] h-[600px] bg-gray-200 rounded-xl"></div>
        <div>
          <div className="mt-2 w-96 h-6 bg-gray-200"></div>
          <div className="mt-2 w-56 h-4 bg-gray-200"></div>
          <div className="mt-16 w-48 h-6 bg-gray-200"></div>
          <div className="mt-16 w-96 h-4 bg-gray-200"></div>
          <div className="mt-2 w-96 h-4 bg-gray-200"></div>
          <div className="mt-2 w-96 h-4 bg-gray-200"></div>
          <div className="mt-2 w-36 h-4 bg-gray-200"></div>
        </div>
      </div>
    </div>
  )
}