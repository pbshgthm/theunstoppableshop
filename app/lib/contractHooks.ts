import { ethers } from "ethers"
import useSWR from "swr"
import config from "../config.json"
import guildABI from "./guildABI.json"
import { Contract, Provider } from "ethers-multicall"
import { IProductInfo, ISaleInfo, IShopInfo } from "./types"

const provider = new ethers.providers.JsonRpcProvider(config.rpcProvider)
const guild = new ethers.Contract(config.guildAddress, guildABI, provider)
const multiCallProvider = new Provider(provider, 80001)
const multiGuild = new Contract(config.guildAddress, guildABI)
const IGuild = new ethers.utils.Interface(guildABI)

function parseShop(shopId: number, shop: any, benificiaries: any[]): IShopInfo {
  return {
    shopId,
    owner: shop[1],
    detailsCId: shop[2],
    handle: shop[3],
    productsCount: parseInt(shop[4]),
    salesCount: parseInt(shop[5]),
    benificiaries: benificiaries.map((x: any) => (
      { address: x[0], share: parseInt(x[1]) }
    ))
  }
}

function parseProduct(productId: number, product: any): IProductInfo {
  const ratingsNum = product[7].map((x: any) => x)
  const ratingsCount = ratingsNum[0].reduce((acc: number, x: number) => acc + x, 0)
  const ratingsPercent = ratingsCount ? ratingsNum[0].map((x: string) =>
    (parseFloat(x) / ratingsCount) * 100)
    : new Array(4).fill(0)

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

function parseSale(saleId: number, sale: any): ISaleInfo {
  return {
    saleId,
    buyer: sale[0],
    productId: parseInt(sale[2]),
    amount: parseInt(sale[3]),
    saleDeadline: parseInt(sale[4]),
    unlockedLicense: sale[5],
    rating: parseInt(sale[6]),
    status: parseInt(sale[7]),
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
    return rawShops.map(([shop, ben], index) => parseShop(index, shop, ben)).reverse()
  }
  const { data, error } = useSWR(["useShopList"], fetcher)
  return { data, error }
}

export function useOwnerShopList(owner: string | null) {
  const fetcher = async (fn: string, owner: string) => {
    const shopLogs = await provider.getLogs({
      address: config.guildAddress,
      topics: [
        ethers.utils.id("ShopCreated(uint256,address)"),
        ethers.utils.hexZeroPad(owner, 32),
      ],
      fromBlock: "0x0",
      toBlock: "latest",
    })
    const shopIds = shopLogs.map((event) => parseInt(IGuild.parseLog(event).args.shopId))
    const shopInfoCalls = shopIds.map((shopId) => multiGuild.getShopInfo(shopId))
    const rawShops = await multiCallProvider.all(shopInfoCalls)
    return rawShops.map(([shop, ben], index) => parseShop(index, shop, ben)).reverse()
  }
  const { data, error } = useSWR(owner ? ["useOwnerShopList", owner] : null, fetcher)
  return { data, error }
}

export function useProductList(shopId: number | undefined) {
  const fetcher = async (fn: string, id: number) => {
    const rawProducts = await guild.getProducts(id)
    return rawProducts.map((product: any, index: number) => parseProduct(index, product)).reverse() as IProductInfo[]
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
    const pubKey = await guild.publicKeys(address) as string
    return Buffer.from(pubKey, "base64").toString()
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

export function useGuildInfo() {
  const fetcher = async (fn: string) => {
    const guildInfoRaw = await guild.getGuildInfo()
    return {
      owner: guildInfoRaw[0],
      oracleClient: guildInfoRaw[1],
      shopFactory: guildInfoRaw[2],
      ratingReward: ethers.utils.formatEther(guildInfoRaw[3]),
      serviceTax: ethers.utils.formatEther(guildInfoRaw[4]),
    }
  }
  const { data, error } = useSWR(["useGuildInfo"], fetcher)
  return { data, error }
}

export function useSale(
  shopId: number | undefined,
  productId: number | undefined,
  buyer: string | undefined) {
  const fetcher = async (
    fn: string,
    _shopId: number,
    _productId: number,
    _buyer: string
  ) => {
    const response = await provider.getLogs({
      address: config.guildAddress,
      topics: [
        ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
        ethers.utils.hexZeroPad(ethers.utils.hexlify(_shopId), 32),
        ethers.utils.hexZeroPad(_buyer, 32),
        ethers.utils.hexZeroPad(ethers.utils.hexlify(_productId), 32)
      ],
      fromBlock: "0x0",
      toBlock: "latest",
    })
    const saleId = parseInt(IGuild.parseLog(response[0]).args.saleId)
    const saleInfoRaw = await guild.getSaleInfo(shopId, saleId)
    return parseSale(saleId, saleInfoRaw)
  }
  const { data, error } = useSWR(
    shopId !== undefined && productId !== undefined && buyer !== undefined ? ["useSale", shopId, productId, buyer] : null,
    fetcher
  )
  return { data, error }
}


export function useBuyerProducts(buyer: string | null) {
  const fetcher = async (fn: string, buyer: string) => {
    const saleLogs = await provider.getLogs({
      address: config.guildAddress,
      topics: [
        ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
        null,
        ethers.utils.hexZeroPad(buyer, 32),
        null
      ],
      fromBlock: "0x0",
      toBlock: "latest",
    })

    const saleInfos = saleLogs.map((log) => [
      parseInt(IGuild.parseLog(log).args.shopId),
      parseInt(IGuild.parseLog(log).args.saleId)
    ])

    const productInfos = saleLogs.map(log => [
      parseInt(IGuild.parseLog(log).args.shopId),
      parseInt(IGuild.parseLog(log).args.productId)
    ])

    const shopInfos = saleLogs.map(log => parseInt(IGuild.parseLog(log).args.shopId))

    const saleCalls = saleInfos.map(sale => multiGuild.getSaleInfo(...sale))
    const rawSales = await multiCallProvider.all(saleCalls)
    const sales = rawSales.map((sale, index) => parseSale(
      saleInfos[index][1],
      sale
    ))

    const productCalls = productInfos.map(product => multiGuild.getProductInfo(...product))
    const rawProducts = await multiCallProvider.all(productCalls)
    const products = rawProducts.map((product, index) => parseProduct(
      productInfos[index][1],
      product
    ))

    const shopInfoCalls = shopInfos.map((shopId) => multiGuild.getShopInfo(shopId))
    const rawShops = await multiCallProvider.all(shopInfoCalls)
    const shops = rawShops.map(([shop, ben], index) => parseShop(index, shop, ben))

    return sales.map((sale, index) => ({
      sale: sale,
      product: products[index],
      shop: shops[index]
    }))
  }
  const { data, error } = useSWR(buyer ? ["useBuyerProducts", buyer] : null, fetcher)
  return { data, error }

}