// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");

abi = require("./linktoken.json");

async function main() {
  const Signature = await hre.ethers.getContractFactory("Signature");

  const signature = await Signature.deploy();
  await signature.deployed();

  console.log("Signature deployed to:", signature.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
