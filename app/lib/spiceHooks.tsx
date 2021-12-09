import { LogDescription } from "@ethersproject/abi";
import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";

import guildABI from "../../hardhat/artifacts/contracts/Guild.sol/Guild.json";
import shopFactoryABI from "../../hardhat/artifacts/contracts/ShopFactory.sol/ShopFactory.json";
import oracleABI from "../../hardhat/artifacts/contracts/UnlockOracleClient.sol/UnlockOracleClient.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const oracleAddress = "0xE01b7124aA2CBbe2eB01D0680f1dcc7635504D86";
const shopFactoryAddress = "0x625C217b0af0Bd5d1cBa0E4e2f54E91e14361c3F";
const guildAddress = "0x828Bc16dcf05B4A9efE887F2b9689475b163f668";

// event topics
const requestedSaleTopic =
  "0x5cb9ba43d895b2b52a05833fb1e6a565cf3e245d62332664ecede22586f90184";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);
const guild = new ethers.Contract(guildAddress, guildABI.abi, provider);

export function getShopId(shopName: string) {
  const fetcher = async () => {
    const shopId = await guild.getShopIdFromHandle(shopName);
    return shopId;
  };

  const { data, error } = useSWR(["getShopId"], fetcher);
  return { data, error };
}

export function getShopList() {
  const fetcher = async () => {
    const shopCount = await guild.getShopCount();
    const rawShopInfos = await multicallShopInfo(
      Array.from(Array(parseInt(shopCount)).keys())
    );
    const shopInfos = rawShopInfos.map((rawShopInfo, index) => ({
      shopId: index,
      shopOwner: rawShopInfo[1],
      detailsCId: rawShopInfo[2],
    }));

    return shopInfos;
  };

  const { data, error } = useSWR(["getShopList"], fetcher);
  return { data, error };
}

async function multicallShopInfo(shopIds: number[]) {
  const guild = new Contract(guildAddress, guildABI.abi);

  async function call() {
    const ethcallProvider = new Provider(provider);

    await ethcallProvider.init(); // Only required when `chainId` is not provided in the `Provider` constructor
    const shopInfoCalls = [];

    for (let shopId of shopIds) {
      shopInfoCalls.push(guild.getShopInfo(shopId));
    }

    const shopInfos = await ethcallProvider.all(shopInfoCalls);

    return shopInfos;
  }

  const shopInfos = await call();
  return shopInfos;
}

export function getShop(shopId: number) {
  const fetcher = async () => {
    const rawShopInfo = await guild.getShopInfo(shopId);
    const beneficiaries = await guild.getBeneficiaries(shopId);

    const shopInfos = {
      shopOwner: rawShopInfo[1],
      detailsCId: rawShopInfo[2],
      balance: ethers.utils.formatEther(rawShopInfo[3]),
      beneficiaries: beneficiaries,
      productsCount: parseInt(rawShopInfo[5]),
    };

    return shopInfos;
  };

  const { data, error } = useSWR(["getShop"], fetcher);
  return { data, error };
}

export function getProductList(shopId: number) {
  const fetcher = async () => {
    const productsRaw = await guild.getProducts(shopId);
    const products = productsRaw.map((product: any) => ({
      latestContenCID: product[0].at(-1),
      price: ethers.utils.formatEther(product[2]),
      stock: parseInt(product[3]),
      salesCount: parseInt(product[4]),
      totalRevenue: ethers.utils.formatEther(product[5]),
      creationTime: parseInt(product[6]), // isAvailable?
    }));
    return products;
  };

  const { data, error } = useSWR(["getProductList", shopId], fetcher);
  return { data, error };
}
// string[] contentCID;
// string lockedLicense;
// uint256 price;
// uint256 stock;
// uint256 salesCount;
// uint256 revenue;
// uint256 creationTime;
// Ratings ratings;
// bool isAvailable;
export function getProduct(
  shopId: number,
  productId: number,
  contentVersion: number
) {
  const fetcher = async () => {
    const productInfoRaw = await guild.getProductInfo(shopId, productId);
    const productInfo = {
      contentCID: productInfoRaw[0].at(contentVersion - 1),
      price: ethers.utils.formatEther(productInfoRaw[2]),
      stock: parseInt(productInfoRaw[3]),
      salesCount: parseInt(productInfoRaw[4]),
      creationTime: parseInt(productInfoRaw[6]),
      ratings: productInfoRaw[7],
      versionLength: productInfoRaw[0].length,
    };

    return productInfo;
  };
  const { data, error } = useSWR(["getProduct"], fetcher);
  return { data, error };
}

export function getSale(
  shopId: number,
  productId: number,
  buyerAddress: string
) {
  const fetcher = async () => {
    const saleId = await getSaleId(shopId, productId, buyerAddress);
    const saleInfoRaw = await guild.getSaleInfo(shopId, saleId);
    // address buyer;
    // string publicKey;
    // uint256 productId;
    // uint256 amount;
    // uint256 saleDeadline;
    // string unlockedLicense;
    // RatingOptions rating;
    // SaleStatus status;
    const saleInfo = {
      unlockedLicense: saleInfoRaw[5],
      rating: parseInt(saleInfoRaw[6]),
      status: parseInt(saleInfoRaw[7]),
      saleDeadline: parseInt(saleInfoRaw[4]),
      amount: ethers.utils.formatEther(saleInfoRaw[3]),
    };

    return saleInfo;
  };

  const { data, error } = useSWR(["getSale"], fetcher);
  return { data, error };
}

async function getSaleId(
  shopId: number,
  productId: number,
  buyerAddress: string
) {
  let IGuild = new ethers.utils.Interface(guildABI.abi);
  const response = provider.getLogs({
    address: guildAddress,
    topics: [
      // ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
      requestedSaleTopic,
      ethers.utils.hexZeroPad(ethers.utils.hexlify(shopId), 32),
      ethers.utils.hexZeroPad(buyerAddress, 32),
      ethers.utils.hexZeroPad(ethers.utils.hexlify(productId), 32),
    ],
    fromBlock: "0x0",
    toBlock: "latest",
  });

  return response
    .then((logs: ethers.providers.Log[]) =>
      logs.map((logs) => IGuild.parseLog(logs))
    )
    .then((logs) => logs.map((log) => parseInt(log.args.saleId)));
}

export function getBuyerSales(buyerAddress: string) {
  const fetcher = async () => {
    const saleDeets = await getBuyerSaleDeets(buyerAddress);
  };
}

async function multicallSaleInfo(saleDeets: any) {
  const guild = new Contract(guildAddress, guildABI.abi);

  async function call() {
    const ethcallProvider = new Provider(provider);
    await ethcallProvider.init(); // Only required when `chainId` is not provided in the `Provider` constructor
    const saleInfoCalls = [];

    for (const sale in saleDeets) {
      saleInfoCalls.push(
        guild.getSaleInfo(saleDeets[sale].shopId, saleDeets[sale].saleId)
      );
    }
    const closedSaleInfos = await ethcallProvider.all(saleInfoCalls);

    return closedSaleInfos;
  }

  const closedSaleInfos = await call();
  return closedSaleInfos;
}

async function getBuyerSaleDeets(buyerAddress: string) {
  let IGuild = new ethers.utils.Interface(guildABI.abi);
  const response = provider.getLogs({
    address: guildAddress,
    topics: [
      // ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
      requestedSaleTopic,
      null,
      ethers.utils.hexZeroPad(buyerAddress, 32),
      null,
    ],
    fromBlock: "0x0",
    toBlock: "latest",
  });

  return response
    .then((logs: ethers.providers.Log[]) =>
      logs.map((logs) => IGuild.parseLog(logs))
    )
    .then((logs) =>
      logs.map((log) => ({
        shopId: parseInt(log.args.shopId),
        saleId: parseInt(log.args.saleId),
      }))
    );
}
