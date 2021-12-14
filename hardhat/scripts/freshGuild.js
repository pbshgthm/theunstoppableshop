// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");

abi = require("./linktoken.json");

async function main() {
  // const provider = new ethers.providers.JsonRpcProvider(
  //   "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV"
  // );
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const oracleAddress = "0xE94FABD3bbA4225F9821803a179DBBBC6C258C65";
  const shopFactoryAddress = "0x0c1fd5ABB7110BcBedaC303eE8c14a18259D215b";
  const accounts = await ethers.getSigners();
  const linkToken = new ethers.Contract(
    "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", //mumbai
    // "0xa36085F69e2889c224210F603D836748e7dC0088",
    abi,
    accounts[0]
  );

  // We get the contract to deploy
  // const Oracle = await hre.ethers.getContractFactory("UnlockOracleClient");
  const ShopFactory = await ethers.getContractFactory("ShopFactory");
  const Guild = await ethers.getContractFactory("Guild");
  // const oracle = await Oracle.deploy();
  // await oracle.deployed();
  const shopFactory = await ShopFactory.deploy();
  await shopFactory.deployed();
  const guild = await Guild.deploy(oracleAddress, shopFactory.address);
  await guild.deployed();

  console.log("Oracle deployed to:", oracleAddress);
  console.log("ShopFactory deployed to:", shopFactory.address);
  console.log("Guild deployed to:", guild.address);

  const oracleBalance = await linkToken.balanceOf(oracleAddress);

  console.log("Balance:", ethers.utils.formatEther(oracleBalance));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
