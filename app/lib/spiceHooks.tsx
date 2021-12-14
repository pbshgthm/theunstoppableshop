import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";
import { SaleDeets, ProductDeets, swrKeys } from "./interfaces";

import guildABI from "../../hardhat/artifacts/contracts/Guild.sol/Guild.json";
import shopFactoryABI from "../../hardhat/artifacts/contracts/ShopFactory.sol/ShopFactory.json";
import oracleABI from "../../hardhat/artifacts/contracts/UnlockOracleClient.sol/UnlockOracleClient.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const oracleAddress = "0xE94FABD3bbA4225F9821803a179DBBBC6C258C65";
const shopFactoryAddress = "0x89361E2e23fC7100eff28cC41f09cd8B09aA748F";
const guildAddress = "0x1F45098C9075fece682997B6cd919DAb38AAffB8";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);
const guild = new ethers.Contract(guildAddress, guildABI.abi, provider);
const multiguild = new Contract(guildAddress, guildABI.abi);
const ethcallProvider = new Provider(provider, 80001);

// owner, oracleClient, shopFactory, ratingReward, serviceTax;

// address buyer;
// string publicKey;
// uint256 productId;
// uint256 amount;
// uint256 saleDeadline;
// string unlockedLicense;
// RatingOptions rating;
// SaleStatus status;

// string[] contentCID;
// string lockedLicense;
// uint256 price;
// uint256 stock;
// uint256 salesCount;
// uint256 revenue;
// uint256 creationTime;
// Ratings ratings;
// bool isAvailable;

// export const fetcher = async (args: [string, any]) => {
//   if (args[0] === swrKeys.useShopId) {
//     const shopId = await guild.getShopIdFromHandle();
//     return parseInt(shopId);
//   }
// };

export function useShopId(shopName: string | undefined) {
  const fetcher = async (fn: string, shopName: string | undefined) => {
    const shopId = await guild.getShopIdFromHandle(shopName);
    return parseInt(shopId);
  };

  const { data, error } = useSWR(
    shopName ? ["useShopId", shopName] : null,
    fetcher
  );
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
      shopOwner: rawShopInfo[0][1],
      detailsCId: rawShopInfo[0][2],
      shopName: rawShopInfo[0][3],
    }));

    return shopInfos;
  };

  const { data, error } = useSWR(["getShopList"], fetcher);
  return { data, error };
}

async function multicallShopInfo(shopIds: number[]) {
  const multiguild = new Contract(guildAddress, guildABI.abi);

  async function call() {
    const ethcallProvider = new Provider(provider);

    await ethcallProvider.init(); // Only required when `chainId` is not provided in the `Provider` constructor
    const shopInfoCalls = [];

    for (let shopId of shopIds) {
      shopInfoCalls.push(multiguild.getShopInfo(shopId));
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

    // address guild;
    // address owner;
    // string detailsCId;
    // string shopName;
    // uint256 productsCount;
    // uint256 salesCount;
    const shopInfos = {
      shopOwner: rawShopInfo[0][1],
      detailsCId: rawShopInfo[0][2],
      beneficiaries: rawShopInfo[1],
      productsCount: parseInt(rawShopInfo[0][4]),
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
      ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
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

    const buyerSaleInfosRaw = await multicallSaleInfo(saleDeets);

    const buyerSaleInfos = buyerSaleInfosRaw.map((buyerSaleInfoRaw) => ({
      shopId: parseInt(buyerSaleInfoRaw.at(-1)),
      shopOwner: "",
      productId: parseInt(buyerSaleInfoRaw[2]),
      amount: ethers.utils.formatEther(buyerSaleInfoRaw[3]),
      saleDeadline: parseInt(buyerSaleInfoRaw[4]),
      rating: parseInt(buyerSaleInfoRaw[6]),
      price: "",
      contentCID: "",
    }));

    const buyerProductDeets = buyerSaleInfos.map((buyerSaleInfo) => ({
      shopId: buyerSaleInfo.shopId,
      productId: buyerSaleInfo.productId,
    }));
    const buyerProductInfoRaw = await multicallProductInfo(buyerProductDeets);
    for (let i = 0; i < buyerProductInfoRaw.length; i++) {
      buyerSaleInfos[i].price = ethers.utils.formatEther(
        buyerProductInfoRaw[i][2]
      );
      buyerSaleInfos[i].contentCID =
        buyerProductInfoRaw[i][0][saleDeets[i].contentVersion - 1];

      buyerSaleInfos[i].shopOwner = await getShopOwner(
        buyerSaleInfos[i].shopId
      );
    }
    return buyerSaleInfos;
  };

  const { data, error } = useSWR(["getBuyerSales"], fetcher);
  return { data, error };
}

async function multicallProductInfo(productDeets: ProductDeets[]) {
  async function call() {
    const ethcallProvider = new Provider(provider, 80001);

    const productInfoCalls = [];

    for (let key in productDeets) {
      productInfoCalls.push(
        multiguild.getProductInfo(
          productDeets[key].shopId,
          productDeets[key].productId
        )
      );
    }

    const productInfos = await ethcallProvider.all(productInfoCalls);

    return productInfos;
  }

  const productInfos = await call();
  return productInfos;
}

async function multicallSaleInfo(saleDeets: SaleDeets[]) {
  async function call() {
    const ethcallProvider = new Provider(provider, 80001);
    const saleInfoCalls = [];

    for (const sale in saleDeets) {
      saleInfoCalls.push(
        multiguild.getSaleInfo(saleDeets[sale].shopId, saleDeets[sale].saleId)
      );
    }
    const buyerSaleInfos = await ethcallProvider.all(saleInfoCalls);

    return buyerSaleInfos;
  }

  const buyerSaleInfos = await call();
  return buyerSaleInfos.map((buyerSaleInfo, index) => {
    return [...buyerSaleInfo, saleDeets[index].shopId];
  });
}

async function getBuyerSaleDeets(buyerAddress: string) {
  let IGuild = new ethers.utils.Interface(guildABI.abi);
  const response = provider.getLogs({
    address: guildAddress,
    topics: [
      ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
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
        contentVersion: parseInt(log.args.contentVersion),
      }))
    );
}

async function getShopOwner(shopId: number) {
  const shopInfo = await guild.getShopInfo(shopId);
  return shopInfo[0][1];
}

export function useOwnerShopInfo(owner: string | undefined) {
  const fetcher = async (fn: string, owner: string) => {
    const shopIds = await getOwnerShops(owner);
    const shopInfoRaw = await multicallShopInfo(shopIds);
    const OwnerShopInfo = shopInfoRaw.map((shopInfoRaw, index) => ({
      shopId: shopIds[index],
      shopOwner: shopInfoRaw[0][1],
      detailsCID: shopInfoRaw[0][2],
      shopName: shopInfoRaw[0][3],
    }));

    return OwnerShopInfo;
  };

  const { data, error } = useSWR(
    owner ? ["useOwnerShopInfo", owner] : null,
    fetcher
  );
  return { data, error };
}

async function getOwnerShops(buyerAddress: string) {
  let IGuild = new ethers.utils.Interface(guildABI.abi);
  const response = provider.getLogs({
    address: guildAddress,
    topics: [
      ethers.utils.id("ShopCreated(uint256,address)"),
      ethers.utils.hexZeroPad(buyerAddress, 32),
    ],
    fromBlock: "0x0",
    toBlock: "latest",
  });

  return response
    .then((logs: ethers.providers.Log[]) =>
      logs.map((logs) => IGuild.parseLog(logs))
    )
    .then((logs) => logs.map((log) => parseInt(log.args.shopId)));
}

export function useGuildInfo() {
  const fetcher = async (fn: string) => {
    const guildInfoRaw = await guild.getGuildInfo();
    return {
      owner: guildInfoRaw[0],
      oracleClient: guildInfoRaw[1],
      shopFactory: guildInfoRaw[2],
      ratingReward: ethers.utils.formatEther(guildInfoRaw[3]),
      serviceTax: ethers.utils.formatEther(guildInfoRaw[4]),
    };
  };

  const { data, error } = useSWR(["useGuildInfo"], fetcher);
  return { data, error };
}

export function useRecentSales(shopId: number) {
  const fetcher = async (fn: string, shopId: number) => {
    const recentSaleIds = await getRecentSaleIds(shopId);
    const recentSaleDeets = recentSaleIds.map((saleId) => ({
      shopId,
      saleId,
    }));
    const recentSaleInfoRaw = await multicallSaleInfo(recentSaleDeets);
    const productIds = recentSaleInfoRaw.map((saleInfoRaw) => saleInfoRaw[2]);
    const productDeets = productIds.map((productId) => ({
      shopId,
      productId,
    }));
    const productInfoRaw = await multicallProductInfo(productDeets);
    const recentSaleInfo = recentSaleInfoRaw.map((saleInfoRaw, index) => ({
      buyerAddress: saleInfoRaw[0],
      productId: parseInt(saleInfoRaw[2]),
      contentCID: productInfoRaw[index][0].at(-1),
      amount: parseInt(saleInfoRaw[3]),
    }));

    return recentSaleInfo;
  };

  const { data, error } = useSWR(["useRecentSales", shopId], fetcher);
  return { data, error };
}

async function getRecentSaleIds(shopId: number) {
  const oneDay = 432000;
  const { number } = await provider.getBlock("latest");
  const fromBlock = number - 30 * oneDay;
  const IGuild = new ethers.utils.Interface(guildABI.abi);
  const response = provider.getLogs({
    address: guildAddress,
    topics: [
      ethers.utils.id("RequestedSale(uint256,address,uint256,uint8,uint256)"),
      ethers.utils.hexZeroPad(ethers.utils.hexlify(shopId), 32),
      null,
      null,
    ],
    fromBlock: fromBlock,
    toBlock: "latest",
  });

  return response
    .then((logs: ethers.providers.Log[]) =>
      logs.map((logs) => IGuild.parseLog(logs))
    )
    .then((logs) => logs.map((log) => parseInt(log.args.saleId)));
}

export function useApiPublicKey() {
  const fetcher = async (fn: string) => {
    const apiPublicKey = await guild.getApiPublicKey();
    return apiPublicKey;
  };

  const { data, error } = useSWR(["getApiPublicKey"], fetcher);
  return { data, error };
}

export function useCachedPublicKey(address: string) {
  const fetcher = async (fn: string, address: string) => {
    const publicKey = await guild.publicKeys(address);
    return publicKey as string;
  };

  const { data, error } = useSWR(["useCachedPublicKey", address], fetcher);
  return { data, error };
}

export function useProductInfo(productDeets: ProductDeets[]) {
  async function fetcher(fn: string, productDeets: ProductDeets[]) {
    const productInfoCalls = productDeets.map((productDeet) =>
      multiguild.getProductInfo(productDeet.shopId, productDeet.productId)
    );

    const productInfos = await ethcallProvider.all(productInfoCalls);

    return productInfos;
  }
  const { data, error } = useSWR(["useProductInfo", productDeets], fetcher);
  return { data, error };
}

export async function getEmbedding(
  shopId: number,
  productId: number,
  amount: string,
  ethereum: any
) {
  const encoding = getTemplateEncoding(shopId, productId, amount);
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  let EncPublicKey = await ethereum.request({
    method: "eth_getEncryptionPublicKey",
    params: [accounts[0]], // you must have access to the specified account
  });
  console.log("encryptPubkey", EncPublicKey);
  const base64Enc = Buffer.from(EncPublicKey, "utf8").toString("base64");

  let hexPubKey = base64Enc
    .split("")
    .map((c: string) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");

  const calldata = encoding.template + hexPubKey.padEnd(128, "0");

  console.log("Generated calldata:", calldata);

  const transactionParameters = {
    to: guildAddress,
    from: ethereum.selectedAddress, // must match user's active address.
    value: encoding.amount,
    data: calldata, // Optional, but used for defining smart contract creation and interaction.
    chainId: "0x13881",
  };

  const txHash = await ethereum.request({
    method: "eth_sendTransaction",
    params: [transactionParameters],
  });

  // console.log(snippet);
}

function getTemplateEncoding(
  shopId: number,
  productId: number,
  amount: string
) {
  let iface = new ethers.utils.Interface([
    "function checkoutCart((uint,uint,uint)[],string,uint256)",
  ]);

  const base64Enc = Buffer.from(
    "mnJd3QIfEDB+pYC8rv6Nyu3o3zjRyBlzCgwLoZSApEE=",
    "utf8"
  ).toString("base64");
  const UTF = Buffer.from(base64Enc, "base64").toString("utf8");
  console.log("Template UTF", UTF);
  console.log("template base64Enc", base64Enc);
  const hexPubKey = Buffer.from(base64Enc, "base64").toString("hex");
  console.log("template hexPubKey", hexPubKey);
  let calldata = iface.encodeFunctionData("checkoutCart", [
    [[shopId, productId, ethers.utils.parseEther(amount)]],
    base64Enc,
    0,
  ]);
  console.log("Original calldata:", calldata);
  const template = calldata.slice(0, 522);

  return {
    template,
    amount: ethers.utils.parseEther(amount)._hex,
    original: calldata,
  };
}

// function checkoutCart(
//         CartItem[] memory _cartItems,
//         string memory _publicKey,
//         uint256 _redeemCredits
//     ) external payable

// getSignature(0, 0);

// 0xdb66fa79;
// 0000000000000000000000000000000000000000000000000000000000000060
// 00000000000000000000000000000000000000000000000000000000000000e0
// 0000000000000000000000000000000000000000000000000000000000000000
// 0000000000000000000000000000000000000000000000000000000000000001
// 0000000000000000000000000000000000000000000000000000000000000000
// 0000000000000000000000000000000000000000000000000000000000000000
// 000000000000000000000000000000000000000000000000000775f05a074000
// 000000000000000000000000000000000000000000000000000000000000003c
// 6257354b5a444e5253575a465245497263466c444f484a324e6b353564544e76
// 4d337071556e6c43624870445a33644d62317054515842465254303d00000000;
