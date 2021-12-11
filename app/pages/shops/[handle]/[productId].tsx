import { useRouter } from 'next/router'
import Image from 'next/image'
import { useState } from 'react'
import { decryptFile, toDateString, trimHash, unPackIPFS } from '../../../lib/utils'
import { Button } from '../../../components/UIComp'
import { useIPFS } from '../../../lib/miscHooks'
import useAsyncEffect from 'use-async-effect'
import { IProductInfo } from '../../../lib/types'
import saveAs from 'file-saver'
import { useMetaMask } from 'metamask-react'

const infoCID = 'bafybeidx7vlklpvyperstm7i6dom75fpjjnrvkquxvenvj2esyvw662ofq'
const fileCID = 'bafybeibpoxinslpetwvlfozfcecuvg7ul3jmdyf3dio2apzczsmkubvq6m'
const lis = 'i1dt6xJfh/vSvb7edbh/N6hBUHEmodvs'
const unlockedLic = '{"version":"x25519-xsalsa20-poly1305","nonce":"srgZhbx7J2aJwXxI/dIexY8dww8a7kiF","ephemPublicKey":"as9hcSNocFMwVsrsEebI1hpFNfpo2TEloownJUQq6Co=","ciphertext":"xGnm5gTBz5wdpW0nIkAE3FywmDVfKeHHSxFDxbzPo6y0+saARrLMA9evldJ7nk6p"}'

const productSpecs = {
  price: 0.2323232232,
  stock: 100,
  ratings: [12, 2, 16, 31],
  totalRatings: 61,
  saleCount: 23,
  createdAt: 1639210756,
  shopName: 'Universe',
  shopOwner: '0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515'
}


function BuyerOptions() {
  return (
    <div className="flex flex-row gap-2">
      <Button text="Buy Now" isPrimary={true} />
      <Button text="Add to Cart" />
    </div>
  )
}

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
  const [currPreview, setCurrPreview] = useState<number>(0)
  const [productInfo, setProductInfo] = useState<IProductInfo>()
  const [previewStr, setPreviewStr] = useState<string[]>()
  const { data: detailsIPFS, error: detailsIPFSError } = useIPFS(infoCID)
  const { data: filesIPFS, error: filesIPFSError } = useIPFS(fileCID)
  const { ethereum, account } = useMetaMask()

  useAsyncEffect(async () => {
    if (detailsIPFS) {
      const infoFileDict = await unPackIPFS(detailsIPFS)
      const productInfoJson = JSON.parse(await infoFileDict['productInfo.json'].text()) as IProductInfo
      setProductInfo(productInfoJson)

      Promise.all(productInfoJson.preview.map(fileName => {
        return (new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(infoFileDict[fileName])
        }))
      })).then(previewStr => {
        setPreviewStr(previewStr as string[])
      })

    }
  }, [detailsIPFS])

  async function downloadFile() {
    if (filesIPFS) {
      const license = await ethereum.request({
        method: 'eth_decrypt',
        params: [unlockedLic, account]
      })
      const decrypted = await decryptFile(filesIPFS, license)
      saveAs(decrypted, `stuff.zip`)
    }
  }

  return (
    <div> {productInfo &&
      <div className="flex flex-row gap-24">
        <div className="w-[450px] ml-36 mt-8">
          <div className="border rounded-xl h-[600px]">
            {previewStr && <Image src={previewStr[currPreview]} width={450} height={600} objectFit="cover" alt="" className="rounded-xl" />
            }
          </div>
          <div className="flex flex-row gap-2 justify-center mt-4">
            {productInfo.preview.map((x, i) => (
              <div className={`w-3 h-3 cursor-pointer hover:bg-purple-800 rounded-full border-[2px] ${i === currPreview ? 'border-purple-800 bg-purple-800' : 'border-white bg-gray-300'}`} key={`dot-${i}`} onClick={() => setCurrPreview(i)}></div>
            ))}
          </div>
        </div>
        <div className="mt-12 mb-24">
          <div className="text-3xl text-gray-600 font-light">{productInfo.name}</div>
          <div className="my-2 text-gray-500">
            {productSpecs.shopName}
            <span className="text-gray-400 px-2">by</span>
            <span className="text-gray-400 font-mono">
              {trimHash(productSpecs.shopOwner)}
            </span>
          </div>
          <div className="text-orange-800 my-4">{productSpecs.price.toFixed(4)} MATIC
            <span className="text-gray-400 ml-4">
              ≈ {'$' + ((productSpecs.price || 0) / 50).toFixed(2)}
            </span>
          </div>
          <div>
            {(productSpecs.stock > 999)
              ?
              <div className="mb-2">
                <span className="text-sm text-purple-800">LIMITED EDITION</span>
                <span className="text-gray-500 text-sm ml-4">
                  {productSpecs.stock - productSpecs.saleCount} of {productSpecs.stock} Available
                </span>
              </div>
              :
              <span className="text-gray-500 text-sm mr-4">
                {productSpecs.saleCount} Sold
              </span>
            }
            <span className="text-gray-400 text-sm">
              Listed on {toDateString(productSpecs.createdAt, true)}
            </span>
          </div>
          <div className="flex flex-row gap-4 my-8 text-gray-400 text-xs items-center">
            {productSpecs.ratings.map((rating, i) => (
              <div key={'rating-' + i} className="flex flex-row items-center">
                <span className={`mr-1 ${Math.max(...productSpecs.ratings) === rating ? 'text-orange-800' : ''}`}>
                  {Math.round(rating / productSpecs.totalRatings * 100)}%
                </span>
                <Image src={`/assets/rating_${i}.png`} width={24} height={24} objectFit="cover" alt="" className={`rounded-full ${Math.max(...productSpecs.ratings) === rating ? '' : 'grayscale'}`} />
              </div>
            ))}
            from {productSpecs.totalRatings} ratings
          </div>
          <DownloadOptions onClick={downloadFile} />
          <DetailsBox infoList={sampleInfo} title="Product Details" />
          <div className="text-sm w-[480px] text-gray-500 mt-8 leading-6">{productInfo.description}</div>
        </div>
      </div>
    }
    </div>
  )
}
