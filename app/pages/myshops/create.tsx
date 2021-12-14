import { useEffect, useState } from "react"
import { FileUpload } from "../../components/FileUpload"
import { TextInput, TextArea, BenificiaryInput } from "../../components/Inputs"
import Image from "next/image"
import { sendToEstuary, trimString, zipFiles } from "../../lib/utils"
import { Button, Spinner } from "../../components/UIComp"
import { useMetaMask } from "metamask-react"
import { IBeneficiary, IShopDesc } from "../../lib/types"
import { createShop } from "../../lib/contractCalls"
import Router from 'next/router'
import Link from "next/link"
import { useCachedPublicKey } from "../../lib/hooks"


const emptyBeneficiary: IBeneficiary = {
  address: "",
  share: 0,
}

export default function CreateShop() {

  const { account, ethereum } = useMetaMask()
  const { data: cachedPublicKey, error: cachedPublicKeyError } = useCachedPublicKey(account)

  const [handle, setHandle] = useState<string>()
  const [name, setName] = useState<string>()
  const [logo, setLogo] = useState<File>()
  const [tagline, setTagline] = useState<string>()
  const [description, setDescription] = useState<string>()


  const [website, setWebsite] = useState<string>()
  const [twitter, setTwitter] = useState<string>()
  const [discord, setDiscord] = useState<string>()
  const [youtube, setYoutube] = useState<string>()
  const [spotify, setSpotify] = useState<string>()

  const [loadingMsg, setLoadingMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("Mandatory Fields (*) are not filled")

  const [benificiaries, setBenificiaries] = useState<IBeneficiary[]>(new Array(3).fill(emptyBeneficiary))


  const validBenificiaries = benificiaries.filter(b => b.address && b.share)



  const isValidShop = account && handle && name && logo && tagline && description && isValidBeneficiary()

  function addBeneficiary(index: number, value: IBeneficiary) {
    const newBenificiary = [...benificiaries]
    if (newBenificiary[index].address !== value.address || newBenificiary[index].share !== value.share) {
      newBenificiary[index] = value
      setBenificiaries(newBenificiary)
    }
  }

  function isValidBeneficiary() {
    if (validBenificiaries.length == 0) return false
    let sharePercent = 0
    validBenificiaries.forEach(b => {
      sharePercent += b.share
    })
    if (sharePercent === 100) return true
  }


  useEffect(() => {
    if (isValidShop) setErrorMsg("")
    else setErrorMsg("Mandatory Fields (*) are not filled")
  }, [isValidShop])

  async function initCreateShop() {

    if (!isValidShop) return

    const shopDesc: IShopDesc = {
      name,
      tagline,
      logo: logo.name,
      description,
      website,
      twitter,
      discord,
      youtube,
      spotify
    }

    const detailsFile = new File([JSON.stringify(shopDesc)], "shopDesc.json")
    const allFiles = [logo, detailsFile]

    const detailsFileName = `${handle}-shop-desc`
    const zipped = await zipFiles(allFiles, detailsFileName) as Blob
    setLoadingMsg("Upoading metadata to IPFS..")

    const response = await sendToEstuary(zipped, detailsFileName + '.zip')
    setLoadingMsg("Creating Contract..")

    const ownerPublicKey = cachedPublicKey || await ethereum.request({
      method: 'eth_getEncryptionPublicKey',
      params: [account]
    })

    const { success, error } = await createShop(
      handle,
      response.cid,
      validBenificiaries,
      Buffer.from(ownerPublicKey).toString('base64'),
      ethereum
    )

    if (success) {
      setLoadingMsg("")
      Router.push(`/shops/${handle}`)
    } else {
      setLoadingMsg("")
      setErrorMsg(error)
    }
  }

  return (
    <div className="w-[640px] m-auto my-24">
      <div className="text-2xl pl-4 mb-4 text-gray-600">Create Shop</div>
      <div className="p-4 flex flex-col gap-4">
        <div className="uppercase text-xs text-gray-400 my-2">Shop Information</div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Shop Handle *</div>
          <TextInput placeholder={'A unique handle to your shop'} setValue={setHandle} isAlpha={true} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Shop Name *</div>
          <TextInput placeholder={'A beautiful name'} setValue={setName} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Shop Logo *</div>
          <div>
            <FileUpload onlyImages={true} maxFiles={1} setFiles={(value) => setLogo(value.length ? value.slice(-1)[0] : undefined)} />
            {
              logo && <div className="text-sm text-gray-500 py-1 mt-2 rounded-md flex flex-row gap-1 items-center">
                <Image src='/assets/picture.png' width={18} height={18} alt="Shop Logo" />
                {trimString(logo.name, 50)}
              </div>
            }
          </div>
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Tagline *</div>
          <TextInput placeholder={'Your shop, summed up in a line'} setValue={setTagline} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Description *</div>
          <TextArea placeholder={'A brief description'} setValue={setDescription} />
        </div>
        <div className="uppercase text-xs text-gray-400 my-2 mt-8">Beneficiaries and Shares (%) *</div>
        {benificiaries.map((x, i) => (<div key={`benificiary-${i}`} className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Beneficiary {i + 1}</div>
          <BenificiaryInput setValue={(value) => addBeneficiary(i, value)} isOwner={(i == 0)} />
        </div>))}
        <div className="uppercase text-xs text-gray-400 my-2 mt-8">Shop Contacts</div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Website</div>
          <TextInput placeholder={'http://something.cool'} setValue={setWebsite} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Twitter</div>
          <TextInput placeholder={'http://twitter.com/someone'} setValue={setTwitter} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Discord</div>
          <TextInput placeholder={'http://discord.com/someone'} setValue={setDiscord} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Youtube</div>
          <TextInput placeholder={'http://youtube.com/someone'} setValue={setYoutube} />
        </div>
        <div className="flex flex-row text-gray-500 gap-3">
          <div className="text-sm w-56">Spotify</div>
          <TextInput placeholder={'https://spotify.com/something'} setValue={setSpotify} />
        </div>
      </div>
      <div className="flex flex-row gap-4 px-4 mt-8 mb-4 items-center">
        {loadingMsg && <Spinner msg={loadingMsg} />}
        {errorMsg && (!loadingMsg) && <div className="text-red-500 text-sm">{errorMsg}</div>}
        <Link href="/myshops"><a className="ml-auto"><Button text="Cancel" /></a></Link>
        <Button text="Create Shop" isPrimary={true} isDisabled={!isValidShop} onClick={initCreateShop} />
      </div>
    </div>
  )
}