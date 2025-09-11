// Simple Express server to mock a blockchain RPC endpoint for development
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';

const app = express();
const PORT = 8545;

// Add CORS and JSON middleware
app.use(cors());
app.use(express.json());

// Create wallet for mock transactions
const wallet = ethers.Wallet.createRandom();
console.log('Mock blockchain server wallet address:', wallet.address);

// Store mock blockchain state
const mockState = {
  blockNumber: 10000000,
  blocks: [],
  transactions: [],
  gasPrice: ethers.parseUnits('20', 'gwei'),
  timestamp: Date.now(),
};

// Generate some initial blocks and transactions
for (let i = 0; i < 10; i++) {
  const blockNumber = mockState.blockNumber - i;
  const timestamp = mockState.timestamp - (i * 12000);
  
  // Create a block
  const block = {
    number: blockNumber,
    hash: '0x' + Buffer.from(blockNumber.toString()).toString('hex').padStart(64, '0'),
    parentHash: '0x' + Buffer.from((blockNumber - 1).toString()).toString('hex').padStart(64, '0'),
    timestamp,
    transactions: [],
  };
  
  // Add some transactions to the block
  for (let j = 0; j < Math.floor(Math.random() * 5) + 1; j++) {
    const tx = {
      hash: '0x' + Buffer.from(`${blockNumber}-${j}`).toString('hex').padStart(64, '0'),
      from: wallet.address,
      to: ethers.Wallet.createRandom().address,
      value: ethers.parseEther((Math.random() * 10).toFixed(4)),
      gasPrice: mockState.gasPrice,
      blockNumber,
      blockHash: block.hash,
      timestamp,
    };
    
    block.transactions.push(tx.hash);
    mockState.transactions.push(tx);
  }
  
  mockState.blocks.push(block);
}

// JSON-RPC handler
app.post('/', (req, res) => {
  const { method, params, id } = req.body;
  
  try {
    let result;
    
    // Handle standard Ethereum JSON-RPC methods
    switch (method) {
      case 'eth_blockNumber':
        result = '0x' + mockState.blockNumber.toString(16);
        break;
        
      case 'eth_getBlockByNumber':
        const blockNumber = parseInt(params[0], 16);
        const block = mockState.blocks.find(b => b.number === blockNumber) || mockState.blocks[0];
        result = {
          number: '0x' + block.number.toString(16),
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: '0x' + Math.floor(block.timestamp / 1000).toString(16),
          transactions: block.transactions,
        };
        break;
        
      case 'eth_getTransactionByHash':
        const txHash = params[0];
        const tx = mockState.transactions.find(t => t.hash === txHash);
        result = tx ? {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: '0x' + tx.value.toString(16),
          gasPrice: '0x' + tx.gasPrice.toString(16),
          blockNumber: '0x' + tx.blockNumber.toString(16),
          blockHash: tx.blockHash,
        } : null;
        break;
        
      case 'eth_gasPrice':
        result = '0x' + mockState.gasPrice.toString(16);
        break;
        
      case 'eth_chainId':
        result = '0x' + (31337).toString(16); // Local hardhat chain ID
        break;
        
      case 'net_version':
        result = '31337';
        break;
        
      case 'eth_accounts':
        result = [wallet.address];
        break;
        
      case 'eth_getBalance':
        result = '0x' + ethers.parseEther('100').toString(16);
        break;
        
      default:
        // For unimplemented methods, return a generic successful response
        console.log(`Mock blockchain received unimplemented method: ${method}`);
        result = null;
    }
    
    res.json({
      jsonrpc: '2.0',
      id,
      result,
    });
  } catch (error) {
    console.error('Error handling RPC request:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: 'Internal error' },
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', blockNumber: mockState.blockNumber });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock blockchain RPC server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Update the blockchain state periodically (new blocks)
setInterval(() => {
  mockState.blockNumber++;
  mockState.timestamp += 12000; // ~12 seconds per block
  
  const newBlock = {
    number: mockState.blockNumber,
    hash: '0x' + Buffer.from(mockState.blockNumber.toString()).toString('hex').padStart(64, '0'),
    parentHash: mockState.blocks[0].hash,
    timestamp: mockState.timestamp,
    transactions: [],
  };
  
  // Generate 0-3 new transactions for this block
  for (let j = 0; j < Math.floor(Math.random() * 4); j++) {
    const tx = {
      hash: '0x' + Buffer.from(`${mockState.blockNumber}-${j}`).toString('hex').padStart(64, '0'),
      from: wallet.address,
      to: ethers.Wallet.createRandom().address,
      value: ethers.parseEther((Math.random() * 10).toFixed(4)),
      gasPrice: mockState.gasPrice,
      blockNumber: mockState.blockNumber,
      blockHash: newBlock.hash,
      timestamp: mockState.timestamp,
    };
    
    newBlock.transactions.push(tx.hash);
    mockState.transactions.push(tx);
  }
  
  mockState.blocks.unshift(newBlock);
  
  // Keep only the most recent 100 blocks and 500 transactions for memory management
  if (mockState.blocks.length > 100) mockState.blocks.pop();
  if (mockState.transactions.length > 500) mockState.transactions = mockState.transactions.slice(0, 500);
  
  console.log(`New block mined: ${mockState.blockNumber}, txs: ${newBlock.transactions.length}`);
}, 12000);
