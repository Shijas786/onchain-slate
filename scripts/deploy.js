const hre = require("hardhat");

async function main() {
  console.log("Deploying DrawingNFT contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const DrawingNFT = await hre.ethers.getContractFactory("DrawingNFT");
  const drawingNFT = await DrawingNFT.deploy();

  await drawingNFT.waitForDeployment();

  const contractAddress = await drawingNFT.getAddress();
  console.log("DrawingNFT deployed to:", contractAddress);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await drawingNFT.deploymentTransaction().wait(5);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("Owner Address:", deployer.address);
  console.log("Network:", hre.network.name);
  
  console.log("\n=== Next Steps ===");
  console.log("1. Add contract address to .env.local:");
  console.log(`   NEXT_PUBLIC_DRAWING_NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. Verify on Basescan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

