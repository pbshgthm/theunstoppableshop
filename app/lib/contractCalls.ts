import { ethers } from "ethers"
import config from "../config.json"
import { IBeneficiary } from "./types"
import guildABI from "../lib/guildABI.json"



export async function createShop(
  shopName: string,
  detailsCID: string,
  beneficiaries: IBeneficiary[],
  ethereum: ethers.providers.ExternalProvider
) {
  const beneficiariesList = beneficiaries.map(b => [b.address, b.share])
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const guild = new ethers.Contract(config.guildAddress, guildABI, signer)
  try {
    const txn = await guild.createShop(shopName, detailsCID, beneficiariesList)
    await txn.wait()
    return { success: true, error: '' }
  } catch (err) {
    const error = err as any
    let errorMessage = ''
    try {
      errorMessage = error.data.message.replace('execution reverted: ', '')
    } catch {
      errorMessage = error.message
      if (errorMessage === 'MetaMask Tx Signature: User denied transaction signature.')
        errorMessage = 'You\'ev denied transaction signature :('
    }
    return { success: false, error: errorMessage }
  }
}

