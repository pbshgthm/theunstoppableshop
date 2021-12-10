import { LogDescription } from "@ethersproject/abi";
import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";

import guildABI from "../../hardhat/artifacts/contracts/Guild.sol/Guild.json";
import shopFactoryABI from "../../hardhat/artifacts/contracts/ShopFactory.sol/ShopFactory.json";
import oracleABI from "../../hardhat/artifacts/contracts/UnlockOracleClient.sol/UnlockOracleClient.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const oracleAddress = "0x3b7617D4f04DD706D5ff5d2FbE65Cef40eDa3479";
const shopFactoryAddress = "0x57D55Aa0dD02d9FC9024DeC39623195eA688a01C";
const guildAddress = "0x064e77648cDA31e46d4cA135012F0ea0735Aad2B";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);

export async function createShop(
  shopName: string,
  detailsCID: string,
  beneficiary: any,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const guild = new ethers.Contract(guildAddress, guildABI.abi, signer);
  const txn = await guild.createShop("sushi", "deets5", [
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
