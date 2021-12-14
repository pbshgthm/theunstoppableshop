import { useRouter } from 'next/router'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { decryptFile, effectivePrice, toDateString, trimHash, unPackIPFS } from '../../../lib/utils'
import { Button, Spinner } from '../../../components/UIComp'
import useAsyncEffect from 'use-async-effect'
import { ICart, IProductDesc } from '../../../lib/types'
import saveAs from 'file-saver'
import { useMetaMask } from 'metamask-react'
import { useCachedPublicKey, useProduct, useShop, useShopId, useSale, useGuild, useIPFS } from '../../../lib/hooks'
import { addRating, checkoutCart } from '../../../lib/contractCalls'


export default function Product() {
  const router = useRouter()
  const { handle } = router.query
  const productStr = router.query.productId as string
  const productId = productStr?.split('-')[1]
  const { ethereum, account } = useMetaMask()
  const { data: shopId, error: shopIdError } = useShopId(handle as string)
  const { data: shopInfo, error: shopInfoError } = useShop(shopId)
  const { data: cachedPublicKey, error: cachedPubilcKey } = useCachedPublicKey(account)
  const [rating, setRating] = useState(0)
  const { data: guildInfo, error: guildInfoError } = useGuild()


  const { data: sale, error: saleError } = useSale(
    shopId,
    parseInt(productId as string),
    account || undefined
  )
  const { data: productInfo, error: productInfoError } = useProduct(
    shopId,
    parseInt(productId as string)
  )

  const isSeller = (account?.toLowerCase() === shopInfo?.owner.toLowerCase())

  const [currPreview, setCurrPreview] = useState<number>(0)
  const [productDesc, setProductDesc] = useState<IProductDesc>()
  const [previewStr, setPreviewStr] = useState<string[]>()

  const [loadingMsg, setLoadingMsg] = useState<string>()
  const [errorMsg, setErrorMsg] = useState<string>()

  const { data: descIPFS, error: descIPFSError } = useIPFS(productInfo?.detailsCID)
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

  function BuyOptions() {
    return (
      <div className="flex flex-row gap-2">
        <Button text="Buy Now" isPrimary={true} onClick={buyNow} />
      </div>
    )
  }

  function SellerOptions() {
    return (
      <div className="flex flex-row gap-4 items-center">
        <Button text="Download" />
        <div className='text-purple-800 text-sm'>
          {productInfo?.totalRevenue} MATIC earned so far
        </div>
      </div>
    )
  }

  async function addSaleRating(rating: number) {
    await addRating(
      shopId as number,
      sale?.saleId as number,
      rating,
      ethereum
    )
  }

  function PostSaleOptions() {
    const ratingList = new Array(4).fill(0)

    return (
      <div>
        <div className="flex flex-row gap-2 items-center">
          <Button text="Download" isPrimary={true} onClick={downloadFile} />
          <div className="text-gray-500 text-xs">You’ve purchased this product</div>
        </div>
        <div className="flex flex-row gap-1 mt-3 ml-1 items-center">
          {ratingList.map((_, i) => (
            <Image key={'rating-' + i + 1} src={`/assets/rating_${i}.png`} width={24} height={24} alt="" className={`rounded-full cursor-pointer ${rating ? 'hover:grayscale' : 'hover:grayscale-0'} ${rating === i + 1 ? 'hover:grayscale-0' : 'grayscale'}`}
              onClick={() => {
                if (!rating) {
                  setRating(i + 1)
                  addSaleRating(i + 1)
                }
              }}
            />))}
          <div className="text-gray-500 text-xs ml-2">
            {rating ? "0.001 MATIC added in store credits for rating this product" : "Rate this product to get 0.001 MATIC added in credits"}
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (sale) {
      setLoadingMsg('')
      setErrorMsg('')
      if (sale.rating) {
        setRating(sale.rating)
      }
      console.log(sale.rating, 'rating')
    }
  }, [sale])

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
      price: effectivePrice(productInfo?.price!, guildInfo?.ratingReward!, guildInfo?.serviceTax!)
    }
    setLoadingMsg('Requesting Product..')
    const buyerPublicKey = cachedPublicKey || await ethereum.request({
      method: 'eth_getEncryptionPublicKey',
      params: [account]
    })
    const { success, error } = await checkoutCart(
      [cartItem],
      Buffer.from(buyerPublicKey as string).toString('base64'),
      0,
      ethereum
    )
    if (success) {

    } else {
      setLoadingMsg("")
      setErrorMsg(error)
    }
  }

  return (
    <div> {productInfo && productDesc && shopInfo && guildInfo &&
      <div className="flex flex-row gap-24 mt-16">
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
        <div className="mt-8 mb-24">
          <div className="text-3xl text-gray-600 font-light">{productDesc.name}</div>
          <div className="my-2 text-gray-500">
            @{shopInfo.handle}
            <span className="text-gray-400 px-2">by</span>
            <span className="text-gray-400 font-mono">
              {trimHash(shopInfo.owner)}
            </span>
          </div>
          <div className="text-orange-800 my-4">
            {effectivePrice(productInfo.price, guildInfo.serviceTax, guildInfo.ratingReward)} MATIC
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
                <span className={`mr-1 ${Math.max(...productInfo.ratingsPercent) === rating && productInfo.ratingsCount ? 'text-orange-800' : ''}`}>
                  {rating}%
                </span>
                <Image src={`/assets/rating_${i}.png`} width={24} height={24} objectFit="cover" alt="" className={`rounded-full ${Math.max(...productInfo.ratingsPercent) === rating && productInfo.ratingsCount ? '' : 'grayscale'}`} />
              </div>
            ))}
            from {productInfo.ratingsCount} ratings
          </div>
          {sale && <PostSaleOptions />}
          {(!sale) && (!isSeller) && (productInfo.salesCount < productInfo.stock) && <BuyOptions />}
          {(productInfo.salesCount === productInfo.stock) && <div className='text-red-800 text-sm mb-8'>Product is out of Stock :/</div>}
          {isSeller && <SellerOptions />}
          {loadingMsg && <div className='mt-8'><Spinner msg={loadingMsg} /></div>}
          {errorMsg && <div className="text-red-500 text-sm mt-2">{errorMsg}</div>}
          <div className="text-sm w-[480px] text-gray-500 mt-8 leading-6">{productDesc.description}</div>
        </div>
      </div>
    }
    </div>
  )
}