import { ethers } from "ethers"
import config from "../config.json"
import { IBeneficiary, ICart } from "./types"
import guildABI from "../lib/guildABI.json"



export async function createShop(
  shopName: string,
  detailsCID: string,
  beneficiaries: IBeneficiary[],
  ownerPublicKey: string,
  ethereum: ethers.providers.ExternalProvider
) {
  const beneficiariesList = beneficiaries.map(b => [b.address, b.share])
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const guild = new ethers.Contract(config.guildAddress, guildABI, signer)
  try {
    const txn = await guild.createShop(shopName, detailsCID, beneficiariesList, ownerPublicKey)
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
        errorMessage = "You've denied transaction signature :("
    }
    return { success: false, error: errorMessage }
  }
}


export async function addProduct(
  shopId: number,
  contentCID: string[],
  lockedLicense: string,
  sellerLicense: string,
  price: string,
  stock: number,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const guild = new ethers.Contract(config.guildAddress, guildABI, signer)

  try {
    const txn = await guild.addProduct(
      shopId,
      contentCID,
      lockedLicense,
      sellerLicense,
      ethers.utils.parseEther(price),
      stock
    )
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
        errorMessage = "You've denied transaction signature :("
    }
    return { success: false, error: errorMessage }
  }
}

export async function checkoutCart(
  cartItems: ICart[],
  publicKey: string,
  redeemCredits: number,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const guild = new ethers.Contract(config.guildAddress, guildABI, signer)
  const cartItemsGuild = cartItems.map((item) => [
    item.shopId,
    item.productId,
    ethers.utils.parseEther(item.price.toString()),
  ])
  const cartAmount = cartItems.reduce((acc, item) => acc + item.price, 0)
  try {
    const txn = await guild.checkoutCart(
      cartItemsGuild,
      publicKey,
      redeemCredits,
      { value: ethers.utils.parseEther(cartAmount.toString()) }
    )
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
        errorMessage = "You've denied transaction signature :("
    }
    return { success: false, error: errorMessage }
  }

}

export async function addRating(
  shopId: number,
  saleId: number,
  rating: number,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const guild = new ethers.Contract(config.guildAddress, guildABI, signer)
  const txn = await guild.addRating(shopId, saleId, rating)
  await txn.wait()
  console.log("Rating added")
}