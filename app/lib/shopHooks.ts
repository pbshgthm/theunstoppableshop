import { ethers } from "ethers"
import useSWR from "swr"
import config from "../config.json"
import guildABI from "./guildABI.json"

const provider = new ethers.providers.JsonRpcProvider(config.rpcProvider)
const guild = new ethers.Contract(config.guildAddress, guildABI, provider)


export function useShopNameToId(shopHandle: string | undefined) {
  async function fetcher(fn: string, handle: string) {
    const shopId = await guild.getShopIdFromHandle(handle)
    return shopId as number
  }
  const { data, error } = useSWR(shopHandle ? ["getShopId", shopHandle] : null, fetcher)
  return { data, error }
}

export function useShop(shopId: number | undefined) {
  async function fetcher(fn: string, id: number) {
    const rawShop = await guild.getShopInfo(id)
    const beneficiaries = await guild.getBeneficiaries(id)
    const shop = {
      owner: rawShop[1],
      detailsCId: rawShop[2],
      beneficiaries: beneficiaries,
      productsCount: parseInt(rawShop[4]),
    }
    return shop
  }
  const { data, error } = useSWR(shopId ? ["useShop", shopId] : null, fetcher)
  return { data, error }
}