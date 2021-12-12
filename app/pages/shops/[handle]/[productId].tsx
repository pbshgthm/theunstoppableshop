import { useRouter } from 'next/router'
import Image from 'next/image'
import { useState } from 'react'
import { decryptFile, toDateString, trimHash, unPackIPFS } from '../../../lib/utils'
import { Button } from '../../../components/UIComp'
import { useIPFS } from '../../../lib/miscHooks'
import useAsyncEffect from 'use-async-effect'
import { ICart, IProductDesc } from '../../../lib/types'
import saveAs from 'file-saver'
import { useMetaMask } from 'metamask-react'
import { useCachedPublicKey, useProduct, useShop, useShopId, useSale } from '../../../lib/contractHooks'
import { checkoutCart } from '../../../lib/contractCalls'


function DownloadOptions({ onClick }: { onClick: () => void }) {
  const ratingList = new Array(4).fill(0)
  const [rating, setRating] = useState(0)

  return (
    <div>
      <div className="flex flex-row gap-2 items-center">
        <Button text="Download" isPrimary={true} onClick={onClick} />
        <div className="text-gray-500 text-xs">You’ve purchased this product</div>
      </div>
      <div className="flex flex-row gap-1 mt-3 items-center">
        {ratingList.map((_, i) => (
          <Image key={'rating-' + i} src={`/assets/rating_${i}.png`} width={24} height={24} alt="" className={`rounded-full cursor-pointer hover:grayscale-0 ${rating === i ? '' : 'grayscale'}`} onClick={() => setRating(i)} />
        ))}
        <div className="text-gray-500 text-xs ml-2">0.05 MATIC added in store credits for rating this product</div>
      </div>
    </div>
  )
}

const sampleInfo = [
  ['Content CID', trimHash('0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515')],
  ['Description CID', trimHash('0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515')],
  ['License Hash', trimHash('0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515')],
  ['Versions', 4],
]

function DetailsBox({ title, infoList }: {
  title: string,
  infoList: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="w-96 mt-8" >
      <div className="text-sm text-gray-500 cursor-pointer hover:text-purple-800 group select-none" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-lg text-gray-400 mr-2 group-hover:text-purple-800">
          {isOpen ? '-' : '+'}
        </span>
        {title}
      </div>
      {isOpen && (
        <div className="ml-4 mt-2">
          {infoList.map(([key, value]) => (
            <div key={key} className="flex flex-row text-gray-400 text-xs border-b py-3">
              <div className="w-48">{key}</div>
              <div className="font-mono text-gray-500">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div >
  )
}

export default function Product() {
  const router = useRouter()
  const { handle, productId } = router.query
  const { ethereum, account } = useMetaMask()
  const { data: shopId, error: shopIdError } = useShopId(handle as string)
  const { data: shopInfo, error: shopInfoError } = useShop(shopId)
  const { data: publicKey, error: publicKeyError } = useCachedPublicKey(account)
  const { data: sale, error: saleError } = useSale(
    shopId,
    parseInt(productId as string),
    account || undefined
  )
  const { data: productInfo, error: productInfoError } = useProduct(
    shopId,
    parseInt(productId as string)
  )

  const [currPreview, setCurrPreview] = useState<number>(0)
  const [productDesc, setProductDesc] = useState<IProductDesc>()
  const [previewStr, setPreviewStr] = useState<string[]>()

  const { data: descIPFS, error: desscIPFSError } = useIPFS(productInfo?.detailsCID)
  const { data: filesIPFS, error: filesIPFSError } = useIPFS(productInfo?.contentCID)

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

  function BuyerOptions() {
    return (
      <div className="flex flex-row gap-2">
        <Button text="Buy Now" isPrimary={true} onClick={buyNow} />
        <Button text="Add to Cart" />
      </div>
    )
  }

  async function downloadFile() {
    if (filesIPFS && sale) {
      const license = await ethereum.request({
        method: 'eth_decrypt',
        params: [sale.unlockedLicense, account]
      })
      const decrypted = await decryptFile(filesIPFS, license)
      saveAs(decrypted, `${productDesc?.name}.zip`)
    }
  }

  async function buyNow() {
    const cartItem: ICart = {
      shopId: shopId as number,
      productId: parseInt(productId as string),
      price: productInfo?.price as number,
    }

    await checkoutCart(
      [cartItem],
      Buffer.from(publicKey as string).toString('base64'),
      0,
      ethereum
    )
  }

  return (
    <div> {productInfo && productDesc && shopInfo && publicKey &&
      <div className="flex flex-row gap-24">
        <div className="w-[450px] ml-36 mt-8">
          <div className="border rounded-xl h-[600px]">
            {previewStr && <Image src={previewStr[currPreview]} width={450} height={600} objectFit="cover" alt="" className="rounded-xl" />
            }
          </div>
          <div className="flex flex-row gap-2 justify-center mt-4">
            {productDesc.preview.map((x, i) => (
              <div className={`w-3 h-3 cursor-pointer hover:bg-purple-800 rounded-full border-[2px] ${i === currPreview ? 'border-purple-800 bg-purple-800' : 'border-white bg-gray-300'}`} key={`dot-${i}`} onClick={() => setCurrPreview(i)}></div>
            ))}
          </div>
        </div>
        <div className="mt-12 mb-24">
          <div className="text-3xl text-gray-600 font-light">{productDesc.name}</div>
          <div className="my-2 text-gray-500">
            {shopInfo.handle}
            <span className="text-gray-400 px-2">by</span>
            <span className="text-gray-400 font-mono">
              {trimHash(shopInfo.owner)}
            </span>
          </div>
          <div className="text-orange-800 my-4">{productInfo.price.toFixed(4)} MATIC
            <span className="text-gray-400 ml-4">
              ≈ {'$' + ((productInfo.price || 0) / 50).toFixed(2)}
            </span>
          </div>
          <div>
            {(productInfo.stock < 4294967295)
              ?
              <div className="mb-2">
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
          <div className="flex flex-row gap-4 my-8 text-gray-400 text-xs items-center">
            {productInfo.ratingsPercent.map((rating, i) => (
              <div key={'rating-' + i} className="flex flex-row items-center">
                <span className={`mr-1 ${Math.max(...productInfo.ratingsPercent) === rating ? 'text-orange-800' : ''}`}>
                  {rating}%
                </span>
                <Image src={`/assets/rating_${i}.png`} width={24} height={24} objectFit="cover" alt="" className={`rounded-full ${Math.max(...productInfo.ratingsPercent) === rating ? '' : 'grayscale'}`} />
              </div>
            ))}
            from {productInfo.ratingsCount} ratings
          </div>
          {sale && <DownloadOptions onClick={downloadFile} />}
          {(!sale) && <BuyerOptions />}
          {false && <DetailsBox infoList={sampleInfo} title="Product Details" />}
          <div className="text-sm w-[480px] text-gray-500 mt-8 leading-6">{productDesc.description}</div>
        </div>
      </div>
    }
    </div>
  )
}