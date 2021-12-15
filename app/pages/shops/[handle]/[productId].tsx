import { useRouter } from 'next/router'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { decryptFile, effectivePrice, generateEmbeddCode, toDateString, trimHash, unPackIPFS } from '../../../lib/utils'
import { Button, Spinner } from '../../../components/UIComp'
import useAsyncEffect from 'use-async-effect'
import { ICart, IProductDesc } from '../../../lib/types'
import saveAs from 'file-saver'
import { useMetaMask } from 'metamask-react'
import { useCachedPublicKey, useProduct, useShop, useShopId, useSale, useGuild, useIPFS, useCredits } from '../../../lib/hooks'
import { addRating, requestSale } from '../../../lib/contractCalls'
import { ProductSkeleton } from '../../../components/ProductPreview'


export default function Product() {
  const router = useRouter()
  const { handle } = router.query
  const productStr = router.query.productId as string
  const productId = productStr?.split('-')[1]
  const { ethereum, account } = useMetaMask()
  const { data: shopId } = useShopId(handle as string)
  const { data: shopInfo } = useShop(shopId)
  const { data: cachedPublicKey } = useCachedPublicKey(account)
  const [rating, setRating] = useState(0)
  const { data: guildInfo } = useGuild()
  const { data: buyerCredits } = useCredits(account)

  const { data: sale, mutate: mutateSale } = useSale(shopId, parseInt(productId as string), account)
  const { data: productInfo, mutate: mutateProduct } = useProduct(shopId, parseInt(productId as string))

  const isSeller = (account?.toLowerCase() === shopInfo?.owner.toLowerCase())

  const [currPreview, setCurrPreview] = useState<number>(0)
  const [productDesc, setProductDesc] = useState<IProductDesc>()
  const [previewStr, setPreviewStr] = useState<string[]>()

  const [loadingMsg, setLoadingMsg] = useState<string>()
  const [errorMsg, setErrorMsg] = useState<string>()

  const { data: descIPFS } = useIPFS(productInfo?.detailsCID)
  const { data: filesIPFS } = useIPFS(productInfo?.contentCID)

  const finalPrice = effectivePrice(productInfo?.price!, guildInfo?.ratingReward!, guildInfo?.serviceTax!)


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
      <div>
        <div className="flex flex-row gap-2 items-center">
          <Button text="Buy Now" isPrimary={true} onClick={buyNow} />
        </div>
      </div>
    )
  }

  function SellerOptions() {

    const [showCopied, setShopCopied] = useState(false)
    async function handleClick() {
      const code = generateEmbeddCode(shopId!, parseInt(productId), finalPrice)
      const cb = navigator.clipboard
      await cb.writeText(code)
      setShopCopied(true)
      setTimeout(() => {
        setShopCopied(false)
      }, 2000)
    }
    return (
      <div>
        <div className="flex flex-row gap-4 items-center">
          <Button text="Download" onClick={() => { downloadFile(true) }} />
          <div className='text-purple-800 text-sm'>
            {productInfo?.totalRevenue} MATIC earned so far
          </div>
        </div>
        <div className='mt-4 flex flex-row items-center text-gray-500 text-sm'>
          Click <span className='text-purple-800 mx-1 hover:underline cursor-pointer' onClick={handleClick}>here</span> to copy embedd code to add this to your website
        </div>
        {showCopied && <div className='text-gray-500 text-sm mt-2'>Copied Embedd Code!</div>}
      </div>
    )
  }

  async function addSaleRating(curRrating: number) {
    setErrorMsg("")
    const { success, error } = await addRating(
      shopId as number,
      sale?.saleId as number,
      curRrating,
      ethereum
    )
    if (success) {
      mutateSale()
    } else {
      setLoadingMsg("")
      setErrorMsg(error)
    }
  }

  function PostSaleOptions({ currRating }: { currRating: number }) {
    const ratingList = new Array(4).fill(0)
    const [ratingIndex, setRatingIndex] = useState(currRating)

    useEffect(() => {
      if (currRating) setRatingIndex(currRating)
    }, [currRating])

    return (
      <div>
        <div className="flex flex-row gap-2 items-center">
          <Button text="Download" isPrimary={true} onClick={() => downloadFile(false)} />
          <div className="text-gray-500 text-xs">You’ve purchased this product</div>
        </div>
        <div className="flex flex-row gap-1 mt-3 ml-1 items-center">
          {ratingList.map((_, i) => (
            <Image key={'rating-' + i + 1} src={`/assets/rating_${i}.png`} width={24} height={24} alt="" className={`rounded-full cursor-pointer ${ratingIndex ? 'hover:grayscale' : 'hover:grayscale-0'} ${ratingIndex === i + 1 ? 'hover:grayscale-0' : 'grayscale'}`}
              onClick={() => {
                if (!ratingIndex) {
                  setRatingIndex(i + 1)
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
    if (sale?.unlockedLicense) {
      setLoadingMsg('')
      setErrorMsg('')
      if (sale.rating) {
        setRating(sale.rating)
      }
      mutateProduct()
    }
  }, [sale, mutateProduct])


  async function downloadFile(isSeller = false) {
    if (filesIPFS && (sale || isSeller)) {
      const license = await ethereum.request({
        method: 'eth_decrypt',
        params: [isSeller ? productInfo?.sellerLicense : sale?.unlockedLicense, account]
      })
      const decrypted = await decryptFile(filesIPFS, license)
      saveAs(decrypted, `${productDesc?.name}.zip`)
    }
  }

  async function buyNow() {

    setLoadingMsg('Requesting Product..')
    const buyerPublicKey = cachedPublicKey || await ethereum.request({
      method: 'eth_getEncryptionPublicKey',
      params: [account]
    })
    const { success, error } = await requestSale(
      shopId as number,
      parseInt(productId as string),
      Buffer.from(buyerPublicKey as string).toString('base64'),
      '0x266bc53048746775f1440944b9521309a2819c78276c15e03581db7a6bb818ed41d45f265f140c55408a4b08e54262e9303ccf125a68161af2b43603bfec3e541b',
      0,
      finalPrice,
      ethereum
    )
    if (success) {

    } else {
      setLoadingMsg("")
      setErrorMsg(error)
      setRating(0)
    }
  }

  return (
    (productInfo && productDesc && shopInfo && guildInfo)
      ? <div className="flex flex-row gap-24 mt-16">
        <div className="w-[450px] ml-36 mt-8">
          <div className="border rounded-xl h-[600px]">
            <Image src={previewStr?.at(currPreview) || '/'} width={450} height={600} objectFit="cover" alt="" className="rounded-xl" placeholder="blur" blurDataURL="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8+B8AAscB4jINlWEAAAAASUVORK5CYII=" />
          </div>
          <div className="flex flex-row gap-2 justify-center mt-4">
            {productDesc.preview.map((x, i) => (
              <div className={`w-2 h-2 cursor-pointer hover:bg-purple-600 rounded-full border-[2px] ${i === currPreview ? 'border-purple-600 bg-purple-600' : 'border-white bg-gray-300'}`} key={`dot-${i}`} onClick={() => setCurrPreview(i)}></div>
            ))}
          </div>
        </div>
        <div className="mt-8 mb-24">
          <div className="text-3xl text-gray-600 font-light">{productDesc.name}</div>
          <div className="my-2 text-gray-500">
            @{shopInfo.handle}
            <span className="text-gray-500 px-2">by</span>
            <span className="text-gray-500 font-mono">
              {trimHash(shopInfo.owner)}
            </span>
          </div>
          <div className="text-orange-800 my-4">
            <span className="text-gray-500">
              {finalPrice} MATIC
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
            <span className="text-gray-500 text-sm">
              Listed on {toDateString(productInfo.creationTime, true)}
            </span>
          </div>
          <div className='text-gray-500 mt-5 text-sm w-96'>
            ✅ Content is securely stored on IPFS and backed by Filecoin Deals. You can verify status <a href={`https://estuary.tech/verify-cid?cid=${productInfo.contentCID}`} target="_blank" rel="noreferrer" className='text-purple-800 hover:underline'>here</a>
          </div>
          <div className="flex flex-row gap-4 my-8 text-gray-500 text-xs items-center">
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
          {sale?.unlockedLicense && <PostSaleOptions currRating={rating} />}
          {(!sale?.unlockedLicense) && (!isSeller) && (productInfo.salesCount < productInfo.stock) && <BuyOptions />}
          {(productInfo.salesCount === productInfo.stock) && (!sale) && <div className='text-red-800 text-sm mb-8'>Product is out of Stock :/</div>}
          {isSeller && <SellerOptions />}
          {loadingMsg && <div className='mt-8'><Spinner msg={loadingMsg} /></div>}
          {errorMsg && <div className="text-red-500 text-sm mt-4">{errorMsg}</div>}
          <div className="text-sm w-[480px] text-gray-500 mt-8 leading-6">{productDesc.description}</div>
        </div>
      </div>
      : <ProductSkeleton />
  )
}
