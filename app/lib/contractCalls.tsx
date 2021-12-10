import { LogDescription } from "@ethersproject/abi";
import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";

import guildABI from "../../hardhat/artifacts/contracts/Guild.sol/Guild.json";
import shopFactoryABI from "../../hardhat/artifacts/contracts/ShopFactory.sol/ShopFactory.json";
import oracleABI from "../../hardhat/artifacts/contracts/UnlockOracleClient.sol/UnlockOracleClient.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const oracleAddress = "0xf8C4f30765cF9bc5F9017441266321dAd7c030A2";
const shopFactoryAddress = "0xB7c8cBB54350DF01Da95DCF0f6114a2575F988E0";
const guildAddress = "0x7336E0A68c3Ae47Cd0b76e471657a9057a0ba7D1";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);

export async function createShop(
  shopName: string,
  detailsCID: string,
  beneficiary: any,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const guild = new ethers.Contract(guildAddress, guildABI.abi, signer);
  const txn = await guild.createShop("sushi5", "deets5", [
    ["0x14ab838b241F234C51E7Ee2d6F077b50605b0003", 50],
    ["0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70", 50],
  ]);

  // console.log(txn);
  // const a = await txn.wait();
  // console.log("Shop response", a);
}

export async function addProduct(
  shopId: number,
  contentCID: string[],
  lockedLicense: string,
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
    ethers.utils.parseEther(price),
    stock
  );

  await txn.wait();
  console.log("Product added");
}
