const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CognisLogger contract...");

  // Get the contract factory
  const CognisLogger = await ethers.getContractFactory("CognisLogger");

  // Deploy the contract
  const cognisLogger = await CognisLogger.deploy();
  await cognisLogger.deployed();

  console.log(`CognisLogger deployed to: ${cognisLogger.address}`);
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: cognisLogger.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: cognisLogger.deployTransaction.blockNumber,
    transactionHash: cognisLogger.deployTransaction.hash,
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`Deployment info saved to: ${deploymentFile}`);

  // Update the contract addresses config
  updateContractAddresses(network.name, network.config.chainId, cognisLogger.address);

  // Verify contract on Etherscan (if not local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await cognisLogger.deployTransaction.wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: cognisLogger.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

function updateContractAddresses(networkName, chainId, contractAddress) {
  const configPath = path.join(__dirname, "..", "src", "config", "contracts.ts");
  
  // Create config directory if it doesn't exist
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  let contractsConfig = {};
  
  // Read existing config if it exists
  if (fs.existsSync(configPath)) {
    try {
      const existingConfig = fs.readFileSync(configPath, 'utf8');
      // Extract the config object from the TypeScript file
      const configMatch = existingConfig.match(/export const CONTRACT_ADDRESSES = ({[\s\S]*?});/);
      if (configMatch) {
        contractsConfig = eval(`(${configMatch[1]})`);
      }
    } catch (error) {
      console.log("Could not read existing config, creating new one");
    }
  }

  // Update with new deployment
  contractsConfig[chainId] = {
    name: networkName,
    cognisLogger: contractAddress,
  };

  // Generate TypeScript config file
  const configContent = `// Auto-generated contract addresses
// Last updated: ${new Date().toISOString()}

export const CONTRACT_ADDRESSES: Record<number, {
  name: string;
  cognisLogger: string;
}> = ${JSON.stringify(contractsConfig, null, 2)};

export const SUPPORTED_CHAINS = Object.keys(CONTRACT_ADDRESSES).map(Number);

export function getContractAddress(chainId: number): string | undefined {
  return CONTRACT_ADDRESSES[chainId]?.cognisLogger;
}

export function isChainSupported(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}
`;

  fs.writeFileSync(configPath, configContent);
  console.log(`Contract addresses updated in: ${configPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });