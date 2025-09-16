import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || "9aa3d95b3bc440fa88ea12eaa4456161";

export default {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network for webcontainer
    weblocal: {
      type: "http",
      url: "http://localhost:8545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      },
      chainId: 31337,
      gas: "auto",
      gasPrice: "auto",
      blockGasLimit: 30000000,
      mining: {
        auto: true,
        interval: 1000
      },
      timeout: 30000
    },
    // Ethereum Sepolia Testnet
    sepolia: {
      type: "http",
      url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Polygon Mumbai Testnet
    mumbai: {
      type: "http",
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // BSC Testnet
    bscTestnet: {
      type: "http",
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [PRIVATE_KEY],
      chainId: 97,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Avalanche Fuji Testnet
    fuji: {
      type: "http",
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 43113,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Arbitrum Sepolia Testnet
    arbitrumSepolia: {
      type: "http",
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 421614,
      gas: 2100000,
      gasPrice: 100000000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};