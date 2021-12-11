import { LogDescription } from "@ethersproject/abi";
import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";

import guildABI from "../../hardhat/artifacts/contracts/Guild.sol/Guild.json";
import shopFactoryABI from "../../hardhat/artifacts/contracts/ShopFactory.sol/ShopFactory.json";
import oracleABI from "../../hardhat/artifacts/contracts/UnlockOracleClient.sol/UnlockOracleClient.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const oracleAddress = "0xA7c7a31fa9466ec666870e2306ABd5fA621f9f1a";
const shopFactoryAddress = "0x89361E2e23fC7100eff28cC41f09cd8B09aA748F";
const guildAddress = "0x10c24Aa930564D2f8431400665A3216FFe4C03DA";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);

export async function createShop(
  shopName: string,
  detailsCID: string,
  beneficiaries: any,
  ownerPublicKey: string,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const guild = new ethers.Contract(guildAddress, guildABI.abi, signer);
  const txn = await guild.createShop(
    shopName,
    detailsCID,
    beneficiaries,
    ownerPublicKey
  );

  // console.log(txn);
  // const a = await txn.wait();
  // console.log("Shop response", a);
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
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const guild = new ethers.Contract(guildAddress, guildABI.abi, signer);
  const txn = await guild.addProduct(
    shopId,
    contentCID,
    lockedLicense,
    sellerLicense,
    ethers.utils.parseEther(price),
    stock
  );

  await txn.wait();
  console.log("Product added");
}
