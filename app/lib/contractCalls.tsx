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
const provider = new ethers.providers.JsonRpcProvider(rpcApi);

export async function createShop(
  shopName: string,
  detailsCID: string,
  beneficiary: any,
  ethereum: ethers.providers.ExternalProvider
) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const guild = new ethers.Contract(guildAddress, guildABI.abi, signer);
  const txn = await guild.createShop("sushi3", "deets3", [
    ["0x14ab838b241F234C51E7Ee2d6F077b50605b0003", 50],
    ["0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70", 50],
  ]);
  await txn.wait();
  console.log("Shop created");
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
