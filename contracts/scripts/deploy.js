const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ReliefToken contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const ReliefToken = await ethers.getContractFactory("ReliefToken");
  const reliefToken = await ReliefToken.deploy(
    "Relief Token",      // name
    "RLT",               // symbol
    deployer.address     // initial owner
  );

  await reliefToken.waitForDeployment();
  const address = await reliefToken.getAddress();

  console.log("\n✅ ReliefToken deployed successfully!");
  console.log("Contract address:", address);
  console.log("Deployer address:", deployer.address);
  console.log("\n📋 Next steps:");
  console.log(`1. Update NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS in .env.local: ${address}`);
  console.log("2. Verify the contract on Etherscan (if on testnet/mainnet)");
  console.log("3. Start using the contract in your frontend!");

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId.toString(),
    },
    contractAddress: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
