import { LogDescription } from "@ethersproject/abi";
import { ethers } from "ethers";
import { Contract, Provider } from "ethers-multicall";
import useSWR from "swr";

import guildABI from "../../hardhat/artifacts/contracts/Guild.sol/Guild.json";
import shopFactoryABI from "../../hardhat/artifacts/contracts/ShopFactory.sol/ShopFactory.json";
import oracleABI from "../../hardhat/artifacts/contracts/UnlockOracleClient.sol/UnlockOracleClient.json";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const oracleAddress = "0x80193Bd25C4f7EED4F05AAaee966F60c514c5034";
const shopFactoryAddress = "0xC0aBE4b9C79559e6477FBf3b45693Aa25F51Fa5E";
const guildAddress = "0x5276eadaa56C33B9b768357793FA1E6684242895";

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
