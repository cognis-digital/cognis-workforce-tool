# Cognis Workforce Tool Blockchain Features

This document provides an overview of the blockchain integration in the Cognis Workforce Tool.

## Overview

The Cognis Workforce Tool now includes a local blockchain capability that runs directly inside the webcontainer. This feature enables:

1. Immutable logging of AI agent interactions
2. Transparent tracking of knowledge base updates
3. Secure storage of important transactions
4. Local development without external blockchain dependencies

## Architecture

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Frontend UI      │────▶│  Cognis API       │────▶│  Local Blockchain │
│  Components       │◀────│  Backend          │◀────│  (Hardhat)        │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

The blockchain integration consists of three main components:

1. **Local Hardhat Blockchain**: A full Ethereum-compatible blockchain running inside the webcontainer
2. **Blockchain API Service**: REST API endpoints that interface with the blockchain
3. **Frontend Components**: React components that display blockchain data and allow interactions

## Smart Contracts

### CognisLogger

The primary smart contract used is `CognisLogger.sol`, which provides the following capabilities:

- **Agent Interaction Logging**: Record interactions between users and AI agents
- **Knowledge Base Tracking**: Log updates to knowledge bases
- **Lead Generation Events**: Track lead generation events with scoring
- **Subscription Updates**: Record subscription tier changes

### Key Contract Functions

```solidity
// Log an AI agent interaction
function logAgentInteraction(
    uint256 agentId,
    string calldata action,
    string calldata metadata
) external payable;

// Log a knowledge base update
function logKnowledgeUpdate(
    uint256 kbId,
    string calldata action,
    string calldata metadata
) external payable;

// Get user statistics
function getUserStats(address user) 
    external view returns (uint256 interactions, uint256 knowledgeUpdates);
```

## Running the Local Blockchain

To start the local blockchain:

```bash
./start-blockchain.sh
```

This script:
1. Starts a local Hardhat blockchain node
2. Deploys the CognisLogger contract
3. Configures test accounts with ETH for transactions
4. Logs blockchain activities to `logs/blockchain.log`

The local blockchain runs on `http://localhost:8545` with chainId `31337`.

## API Endpoints

The Cognis API Backend exposes the following blockchain-related endpoints:

### GET /api/v1/blockchain/status
Returns the current status of the blockchain connection, including:
- Connection status
- Current block number
- Chain ID and network name
- Deployed contract addresses

### POST /api/v1/blockchain/log-interaction
Logs an AI agent interaction to the blockchain.

**Request Body:**
```json
{
  "agentId": 1,
  "action": "query",
  "metadata": "{\"query\": \"What is the weather today?\"}"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "transactionHash": "0x1234...",
    "message": "Agent interaction logged to blockchain"
  }
}
```

### POST /api/v1/blockchain/log-knowledge-update
Logs a knowledge base update to the blockchain.

**Request Body:**
```json
{
  "kbId": 1,
  "action": "update",
  "metadata": "{\"files\": 3, \"tokens\": 1500}"
}
```

### GET /api/v1/blockchain/user-stats/:address
Returns statistics for a specific Ethereum address.

**Response:**
```json
{
  "status": "success",
  "data": {
    "interactions": 5,
    "knowledgeUpdates": 2
  }
}
```

## Frontend Integration

The BlockchainMonitor component (`src/components/blockchain/BlockchainMonitor.tsx`) provides a UI for:

1. Monitoring blockchain status
2. Viewing user statistics
3. Manually logging interactions
4. Viewing transaction results

## Development & Testing

When developing, the system automatically uses:

- Preconfigured test accounts with ETH
- Default mnemonic: `test test test test test test test test test test test junk`
- Hardhat's built-in console for transaction inspection

## Configuration

The blockchain configuration is defined in `hardhat.config.js` with a dedicated `weblocal` network:

```javascript
weblocal: {
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
}
```

## Best Practices

1. **Log Significant Events**: Log important AI interactions and knowledge base updates
2. **Use Structured Metadata**: Store metadata as structured JSON for better querying
3. **Handle Failed Transactions**: Implement proper error handling for blockchain transactions
4. **Monitor Gas Usage**: Keep transactions small to minimize gas costs

## Troubleshooting

**Port in use error:**
If you see "Port 8545 is already in use", check for existing blockchain processes:
```bash
lsof -i:8545
```

**Contract deployment failure:**
Verify Hardhat is properly installed and the contracts compile:
```bash
npx hardhat compile
```

**API connection issues:**
Check the API server logs for blockchain connection errors:
```bash
tail -f logs/server.log
```

## Future Enhancements

1. **Multi-chain support**: Add support for additional blockchain networks
2. **Token-based incentives**: Implement token rewards for contributions
3. **Decentralized storage**: Integrate IPFS for off-chain data storage
4. **Governance features**: Add DAO-style voting for system changes
