import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";
import { chainLinkABI } from "./link-abi";
import { payableABI } from "./payable-abi";

import { output as guildABI } from "./abi/guildABI.json";
import { output as shopFactoryABI } from "./abi/shopFactoryABI.json";
import { output as oracleABI } from "./abi/oracleABI.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";
const chainLinkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const payableAddress = "0x32dac56F7bd946291b4f23852763d739e34923C6";

const oracleAddress = "0xB5168602478dE148C4A19a04c9125437FF2949aA";
const shopFactoryAddress = "0x18A377a8b4f1071432f07EF5cBcFeFa601127305";
const guildAddress = "0xAbB9cbe90EeC05b30f8789537Eb4124f04E377B0";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);

export function useLinkBalance(account: string) {
  const ChainLink = new ethers.Contract(
    chainLinkAddress,
    chainLinkABI,
    provider
  );
  async function fetcher() {
    return await ChainLink.balanceOf(account).then(
      (balance: ethers.BigNumberish) => {
        return ethers.utils.formatEther(balance);
      }
    );
  }
  const { data, error } = useSWR(["balance", account], fetcher);
  return { data, error };
}

export function useEvents(account: string) {
  async function fetcher() {
    const response = provider.getLogs({
      address: chainLinkAddress,
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ethers.utils.hexZeroPad(account, 32),
      ],
      fromBlock: "0x0",
      toBlock: "latest",
    });
    return response.then((logs: ethers.providers.Log[]) => {
      return logs.map((log) => ILink.parseLog(log));
    });
  }
  let ILink = new ethers.utils.Interface(chainLinkABI);
  const { data, error } = useSWR(["events", account], fetcher);
  return { data, error };
}

export function sendLink(
  ethereum:
    | ethers.providers.ExternalProvider
    | ethers.providers.JsonRpcFetchFunc
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const ChainLink = new ethers.Contract(chainLinkAddress, chainLinkABI, signer);
  const amount = ethers.utils.parseEther("0.1");
  const tx = ChainLink.transfer(
    "0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515", // to address
    amount
  );
  console.log("tx", tx);
}

// This function is used to send ether to a contract
export async function sendEther(
  ethereum:
    | ethers.providers.ExternalProvider
    | ethers.providers.JsonRpcFetchFunc
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  console.log("signer", signer);
  const Payable = new ethers.Contract(payableAddress, payableABI, signer);
  console.log(Payable, "Payable");
  const tx = Payable.deposit({ value: ethers.utils.parseEther("0.000001") });
  console.log("tx", tx);
}

export function useShopInfo() {
  async function fetcher() {
    const guild = new ethers.Contract(guildAddress, guildABI.abi, provider);
    const shopCount = await guild.getShopCount();

    const shopInfosRaw = await multicallShopInfo(shopCount);
    const shopInfos = shopInfosRaw.map((shopInfoRaw) => ({
      guildAddress: shopInfoRaw[0],
      ownerAddress: shopInfoRaw[1],
      shopBalance: parseInt(shopInfoRaw[2]),
      detailsCId: shopInfoRaw[3],
      shopName: shopInfoRaw[4],
      productsCount: parseInt(shopInfoRaw[5]),
      salesCount: parseInt(shopInfoRaw[6]),
    }));

    return shopInfos;
  }

  const { data, error } = useSWR(["shopInfos"], fetcher);
  return { data, error };
}

async function multicallShopInfo(shopCount: number) {
  const guild = new Contract(guildAddress, guildABI.abi);

  async function call() {
    const ethcallProvider = new Provider(provider);

    await ethcallProvider.init(); // Only required when `chainId` is not provided in the `Provider` constructor
    const shopInfoCalls = [];

    for (let shopId = 0; shopId < shopCount; shopId++) {
      shopInfoCalls.push(guild.getShopInfo(shopId));
    }

    const shopInfos = await ethcallProvider.all(shopInfoCalls);

    return shopInfos;
  }

  const shopInfos = await call();
  return shopInfos;
}

export function useProductInfo(shopId: number) {
  async function fetcher() {
    const guild = new ethers.Contract(guildAddress, guildABI.abi, provider);
    const productCount = await guild.getProductCount(shopId);

    const productInfosRaw = await multicallProductInfo(shopId, productCount);

    const productInfos = productInfosRaw.map((productInfoRaw) => ({
      productId: parseInt(productInfoRaw[0]),
      contentCId: productInfoRaw[1],
      detailsCId: productInfoRaw[2],
      licenseHash: productInfoRaw[3],
      lockedLicense: productInfoRaw[4],
      price: parseInt(productInfoRaw[5]),
      stock: parseInt(productInfoRaw[6]),
      ratingsCount: parseInt(productInfoRaw[7]),
      ratingsSum: parseInt(productInfoRaw[8]),
      salesCount: parseInt(productInfoRaw[9]),
      isAvailable: productInfoRaw[10],
    }));

    return productInfos;
  }

  const { data, error } = useSWR(["productInfos", shopId], fetcher);
  return { data, error };
}

async function multicallProductInfo(shopId: number, productCount: number) {
  const guild = new Contract(guildAddress, guildABI.abi);

  async function call() {
    const ethcallProvider = new Provider(provider);

    await ethcallProvider.init(); // Only required when `chainId` is not provided in the `Provider` constructor
    const productInfoCalls = [];

    for (let productId = 0; productId < productCount; productId++) {
      productInfoCalls.push(guild.getProductInfo(shopId, productId));
    }

    const productInfos = await ethcallProvider.all(productInfoCalls);

    return productInfos;
  }

  const productInfos = await call();
  return productInfos;
}

export function useProductSaleInfo(productId: number, shopId: number) {
  async function fetcher() {
    const guild = new ethers.Contract(guildAddress, guildABI.abi, provider);
    const closedSaleIds = await guild.getClosedSaleIds(shopId);

    const closedSalesInfoRaw = await multicallSaleInfo(shopId, closedSaleIds);

    const productSaleInfos = closedSalesInfoRaw
      .filter((saleInfoRaw) => parseInt(saleInfoRaw[3]) === productId)
      .map((productSaleRaw) => ({
        saleId: parseInt(productSaleRaw[0]),
        buyer: productSaleRaw[1],
        publicKey: productSaleRaw[2],
        productId: parseInt(productSaleRaw[3]),
        amount: parseInt(productSaleRaw[4]),
        saleDeadline: parseInt(productSaleRaw[5]),
        unlockedLicense: productSaleRaw[6],
        rating: parseInt(productSaleRaw[7]),
        status: productSaleRaw[8],
      }));

    return productSaleInfos;
  }

  const { data, error } = useSWR(["ProductSaleInfos"], fetcher);
  return { data, error };
}

async function multicallSaleInfo(shopId: number, closedSaleIds: number[]) {
  const guild = new Contract(guildAddress, guildABI.abi);

  async function call() {
    const ethcallProvider = new Provider(provider);
    await ethcallProvider.init(); // Only required when `chainId` is not provided in the `Provider` constructor
    const closedSaleInfoCalls = [];

    for (const closedId of closedSaleIds) {
      closedSaleInfoCalls.push(guild.getSaleInfo(shopId, closedId));
    }
    const closedSaleInfos = await ethcallProvider.all(closedSaleInfoCalls);

    return closedSaleInfos;
  }

  const closedSaleInfos = await call();
  return closedSaleInfos;
}

export async function tempProductSale(shopId = 0, productId = 0) {
  const guild = new ethers.Contract(guildAddress, guildABI.abi, provider);
  const closedSaleIds = await guild.getClosedSaleIds(shopId);

  const closedSalesInfoRaw = await multicallSaleInfo(shopId, closedSaleIds);

  const productSaleInfos = closedSalesInfoRaw
    .filter((saleInfoRaw) => parseInt(saleInfoRaw[3]) === productId)
    .map((productSaleRaw) => ({
      saleId: parseInt(productSaleRaw[0]),
      buyer: productSaleRaw[1],
      publicKey: productSaleRaw[2],
      productId: parseInt(productSaleRaw[3]),
      amount: parseInt(productSaleRaw[4]),
      saleDeadline: parseInt(productSaleRaw[5]),
      unlockedLicense: productSaleRaw[6],
      rating: parseInt(productSaleRaw[7]),
      status: productSaleRaw[8],
    }));

  return productSaleInfos;
}
