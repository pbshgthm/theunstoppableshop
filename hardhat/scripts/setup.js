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
  const accounts = await ethers.getSigners();
  const oracleAddress = "0xE94FABD3bbA4225F9821803a179DBBBC6C258C65";
  const shopFactoryAddress = "0x0c1fd5ABB7110BcBedaC303eE8c14a18259D215b";

  // const linkToken = new ethers.Contract(
  //   "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", //mumbai
  //   // "0xa36085F69e2889c224210F603D836748e7dC0088",
  //   abi,
  //   accounts[0]
  // );

  // We get the contract to deploy
  // const Oracle = await hre.ethers.getContractFactory("UnlockOracleClient");
  // const ShopFactory = await hre.ethers.getContractFactory("ShopFactory");
  const Guild = await hre.ethers.getContractFactory("Guild");
  // const oracle = await Oracle.deploy();
  // await oracle.deployed();
  // const shopFactory = await ShopFactory.deploy();
  // await shopFactory.deployed();
  const guild = await Guild.deploy(oracleAddress, shopFactoryAddress);
  await guild.deployed();

  console.log("Oracle deployed to:", oracleAddress);
  console.log("ShopFactory deployed to:", shopFactoryAddress);
  console.log("Guild deployed to:", guild.address);

  const oracleBalance = await linkToken.balanceOf(oracle.address);

  console.log("Balance:", ethers.utils.formatEther(oracleBalance));

  // console.log("Sending link to oracle");
  // let txn = await linkToken.transfer(
  //   oracle.address,
  //   ethers.utils.parseEther("0.1")
  // );
  // await txn.wait();
  // console.log("Link sent");

  txn = await guild.createShop(
    "sushi",
    "deets",
    [
      ["0x14ab838b241F234C51E7Ee2d6F077b50605b0003", 50],
      ["0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70", 50],
    ],
    "bW5KZDNRSWZFREIrcFlDOHJ2Nk55dTNvM3pqUnlCbHpDZ3dMb1pTQXBFRT0="
  );
  await txn.wait();

  console.log("Shop created");

  txn = await guild.createShop(
    "sushi2",
    "deets2",
    [
      ["0x14ab838b241F234C51E7Ee2d6F077b50605b0003", 50],
      ["0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70", 50],
    ],
    "bW5KZDNRSWZFREIrcFlDOHJ2Nk55dTNvM3pqUnlCbHpDZ3dMb1pTQXBFRT0="
  );
  await txn.wait();

  console.log("Shop created");

  txn = await guild.addProduct(
    0,
    ["contenCID"],
    "eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiJHSHJndVZnM1FlSHB4c3VVQUI0QTNoUFluMFdNQkVHUSIsImVwaGVtUHVibGljS2V5IjoiODRkMHY5N1RrM240YkJjcnF6ajU4QThOWjMvQmJ1MXB1b2p2N2RTaUpEWT0iLCJjaXBoZXJ0ZXh0IjoiWVVxS3d3RGo4M0c2d1ZGUjZLeXBzRXVFaEoxK2FJSkFaeXJUTjR6aE9xbTlkbmVOZU4ydTVsNFNLMXdud2N6VCJ9",
    "eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiJHSHJndVZnM1FlSHB4c3VVQUI0QTNoUFluMFdNQkVHUSIsImVwaGVtUHVibGljS2V5IjoiODRkMHY5N1RrM240YkJjcnF6ajU4QThOWjMvQmJ1MXB1b2p2N2RTaUpEWT0iLCJjaXBoZXJ0ZXh0IjoiWVVxS3d3RGo4M0c2d1ZGUjZLeXBzRXVFaEoxK2FJSkFaeXJUTjR6aE9xbTlkbmVOZU4ydTVsNFNLMXdud2N6VCJ9",
    ethers.utils.parseEther("0.0001"),
    100
  );

  await txn.wait();

  console.log("Product created");

  txn = await guild.addProduct(
    0,
    ["contenCID"],
    "eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiJHSHJndVZnM1FlSHB4c3VVQUI0QTNoUFluMFdNQkVHUSIsImVwaGVtUHVibGljS2V5IjoiODRkMHY5N1RrM240YkJjcnF6ajU4QThOWjMvQmJ1MXB1b2p2N2RTaUpEWT0iLCJjaXBoZXJ0ZXh0IjoiWVVxS3d3RGo4M0c2d1ZGUjZLeXBzRXVFaEoxK2FJSkFaeXJUTjR6aE9xbTlkbmVOZU4ydTVsNFNLMXdud2N6VCJ9",
    "eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiJHSHJndVZnM1FlSHB4c3VVQUI0QTNoUFluMFdNQkVHUSIsImVwaGVtUHVibGljS2V5IjoiODRkMHY5N1RrM240YkJjcnF6ajU4QThOWjMvQmJ1MXB1b2p2N2RTaUpEWT0iLCJjaXBoZXJ0ZXh0IjoiWVVxS3d3RGo4M0c2d1ZGUjZLeXBzRXVFaEoxK2FJSkFaeXJUTjR6aE9xbTlkbmVOZU4ydTVsNFNLMXdud2N6VCJ9",
    ethers.utils.parseEther("0.0001"),
    100
  );
  await txn.wait();

  console.log("Product created");

  txn = await guild.checkoutCart(
    [[0, 0, ethers.utils.parseEther("0.0001")]],
    "bW5KZDNRSWZFREIrcFlDOHJ2Nk55dTNvM3pqUnlCbHpDZ3dMb1pTQXBFRT0=",
    0,
    { value: ethers.utils.parseEther("0.0001") }
  );

  await txn.wait();

  console.log("Checkout completed");

  txn = await guild.checkoutCart(
    [[0, 0, ethers.utils.parseEther("0.0001")]],
    "",
    0,
    { value: ethers.utils.parseEther("0.0001") }
  );

  await txn.wait();

  console.log("Checkout completed");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
