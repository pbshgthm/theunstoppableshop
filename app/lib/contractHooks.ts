import { ethers } from "ethers"
import useSWR from "swr"
import config from "../config.json"
import guildABI from "./guildABI.json"
import { Contract, Provider } from "ethers-multicall"
import { IProductInfo, IShopInfo } from "./types"


const provider = new ethers.providers.JsonRpcProvider(config.rpcProvider)
const guild = new ethers.Contract(config.guildAddress, guildABI, provider)
const multiCallProvider = new Provider(provider, 80001)
const multiGuild = new Contract(config.guildAddress, guildABI)


function parseShop(shopId: number, shop: any, benificiaries: any[]) {
  return {
    shopId,
    owner: shop[1],
    detailsCId: shop[2],
    handle: shop[3],
    productsCount: parseInt(shop[4]),
    benificiaries: benificiaries.map((x: any) => (
      { address: x[0], share: parseInt(x[1]) }
    ))
  } as IShopInfo
}



function parseProduct(productId: number, product: any): IProductInfo {
  const ratingsCount = product[7].reduce(
    (acc: number, x: string) => acc + parseInt(x), 0)

  const ratingsPercent = ratingsCount ? product[7].map((x: string) => parseInt(x) / ratingsCount) : new Array(4).fill(0)

  return {
    productId,
    contentCID: product[0].at(-1).split(",")[0],
    detailsCID: product[0].at(-1).split(",")[1],
    price: parseFloat(ethers.utils.formatEther(product[2])),
    stock: parseInt(product[3]),
    salesCount: parseInt(product[4]),
    totalRevenue: parseFloat(ethers.utils.formatEther(product[5])),
    creationTime: parseInt(product[6]),
    ratingsPercent,
    ratingsCount,
    isAvailable: product[8],
    sellerLicense: product[9],
  }
}

export function useShopId(shopHandle: string | undefined) {
  async function fetcher(fn: string, handle: string) {
    return parseInt(await guild.getShopIdFromHandle(handle))
  }
  const { data, error } = useSWR(shopHandle ? ["useShopId", shopHandle] : null, fetcher)
  return { data, error }
}

export function useShop(shopId: number | undefined) {
  async function fetcher(fn: string, id: number) {
    const [rawShop, benificiaries] = await guild.getShopInfo(id)
    return parseShop(id, rawShop, benificiaries)
  }
  const { data, error } = useSWR(shopId !== undefined ? ["useShop", shopId] : null, fetcher)
  return { data, error }
}

export function useShopList() {
  const fetcher = async (fn: string) => {
    const shopCount = await guild.getShopCount()
    const shopIds = Array.from(Array(parseInt(shopCount)).keys())
    const shopInfoCalls = shopIds.map((shopId) => multiGuild.getShopInfo(shopId))
    const rawShops = await multiCallProvider.all(shopInfoCalls)
    return rawShops.map(([shop, ben], index) => parseShop(index, shop, ben))
  }
  const { data, error } = useSWR(["useShopList"], fetcher)
  return { data, error }
}


export function useProductList(shopId: number | undefined) {
  const fetcher = async (fn: string, id: number) => {
    const rawProducts = await guild.getProducts(id)
    return rawProducts.map((product: any, index: number) => parseProduct(index, product)) as IProductInfo[]
  }
  const { data, error } = useSWR(shopId !== undefined ? ["useProductList", shopId] : null, fetcher)
  return { data, error }
}

export function useProduct(shopId: number | undefined, productId: number | undefined) {
  const fetcher = async (fn: string, shopId: number, productId: number) => {
    const rawProduct = await guild.getProductInfo(shopId, productId)
    return parseProduct(productId, rawProduct)
  }
  const { data, error } = useSWR(shopId !== undefined && productId !== undefined ? ["useProduct", shopId, productId] : null, fetcher)
  return { data, error }
}

export function useCachedPublicKey(address: string | null) {
  const fetcher = async (fn: string, address: string) => {
    return await guild.publicKeys(address) as string
  }
  const { data, error } = useSWR(address ? ["useCachedPublicKey", address] : null, fetcher)
  return { data, error }
}

export function useApiPublicKey() {
  const fetcher = async (fn: string) => {
    return await guild.getApiPublicKey() as string
  }
  const { data, error } = useSWR(["useApiPublicKey"], fetcher)
  return { data, error }
}
