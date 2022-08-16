import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const JellyBots = await ethers.getContractFactory("JellyBots");
  const jellyBots = await JellyBots.deploy();

  console.log("JellyBots address:", jellyBots.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
