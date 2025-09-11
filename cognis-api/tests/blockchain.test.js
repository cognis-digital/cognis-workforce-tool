const { expect } = require('chai');
const { ethers } = require('hardhat');
const sinon = require('sinon');

describe('CognisLogger Contract', function() {
  let CognisLogger;
  let cognisLogger;
  let owner;
  let user1;
  let user2;
  
  // Setup test environment before each test
  beforeEach(async function() {
    // Get signers (accounts)
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy a fresh contract for each test
    CognisLogger = await ethers.getContractFactory('CognisLogger');
    cognisLogger = await CognisLogger.deploy();
    await cognisLogger.deployed();
  });
  
  describe('Deployment', function() {
    it('Should set the right owner', async function() {
      expect(await cognisLogger.owner()).to.equal(owner.address);
    });
    
    it('Should have zero initial interactions', async function() {
      expect(await cognisLogger.totalInteractions()).to.equal(0);
    });
    
    it('Should have zero initial knowledge updates', async function() {
      expect(await cognisLogger.totalKnowledgeUpdates()).to.equal(0);
    });
  });
  
  describe('Logging Functions', function() {
    const logFee = ethers.utils.parseEther('0.001');
    
    it('Should log agent interaction correctly', async function() {
      const agentId = 123;
      const action = 'query';
      const metadata = '{"query": "What is the weather?"}';
      
      // Log an interaction
      await cognisLogger.connect(user1).logAgentInteraction(agentId, action, metadata, { value: logFee });
      
      // Verify the interaction was logged
      expect(await cognisLogger.totalInteractions()).to.equal(1);
      expect(await cognisLogger.userInteractionCount(user1.address)).to.equal(1);
      
      // Check the interaction details
      const interaction = await cognisLogger.getInteraction(0);
      expect(interaction.user).to.equal(user1.address);
      expect(interaction.agentId).to.equal(agentId);
      expect(interaction.action).to.equal(action);
      expect(interaction.metadata).to.equal(metadata);
    });
    
    it('Should log knowledge update correctly', async function() {
      const kbId = 456;
      const action = 'update';
      const metadata = '{"files": 3, "tokens": 1500}';
      
      // Log a knowledge update
      await cognisLogger.connect(user2).logKnowledgeUpdate(kbId, action, metadata, { value: logFee });
      
      // Verify the update was logged
      expect(await cognisLogger.totalKnowledgeUpdates()).to.equal(1);
      expect(await cognisLogger.userKnowledgeCount(user2.address)).to.equal(1);
      
      // Check the update details
      const update = await cognisLogger.getKnowledgeUpdate(0);
      expect(update.user).to.equal(user2.address);
      expect(update.kbId).to.equal(kbId);
      expect(update.action).to.equal(action);
      expect(update.metadata).to.equal(metadata);
    });
    
    it('Should fail if fee is insufficient', async function() {
      const insufficientFee = ethers.utils.parseEther('0.0001');
      
      // Try to log with insufficient fee
      await expect(
        cognisLogger.connect(user1).logAgentInteraction(1, 'test', 'test', { value: insufficientFee })
      ).to.be.revertedWith('Insufficient fee');
    });
    
    it('Should batch log interactions correctly', async function() {
      const agentIds = [1, 2, 3];
      const actions = ['query', 'response', 'feedback'];
      const metadatas = ['{"q": "test1"}', '{"r": "test2"}', '{"f": "test3"}'];
      const totalFee = logFee.mul(3);
      
      // Batch log interactions
      await cognisLogger.connect(user1).batchLogInteractions(
        agentIds, actions, metadatas, { value: totalFee }
      );
      
      // Verify the interactions were logged
      expect(await cognisLogger.totalInteractions()).to.equal(3);
      expect(await cognisLogger.userInteractionCount(user1.address)).to.equal(3);
    });
  });
  
  describe('Admin Functions', function() {
    it('Should allow owner to set log fee', async function() {
      const newFee = ethers.utils.parseEther('0.002');
      
      await cognisLogger.connect(owner).setLogFee(newFee);
      
      expect(await cognisLogger.logFee()).to.equal(newFee);
    });
    
    it('Should not allow non-owner to set log fee', async function() {
      const newFee = ethers.utils.parseEther('0.002');
      
      await expect(
        cognisLogger.connect(user1).setLogFee(newFee)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
    
    it('Should allow owner to withdraw fees', async function() {
      const logFee = await cognisLogger.logFee();
      
      // Log something to generate fees
      await cognisLogger.connect(user1).logAgentInteraction(1, 'test', 'test', { value: logFee });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      // Withdraw fees
      await cognisLogger.connect(owner).withdrawFees();
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      // Balance should increase (minus gas costs)
      expect(finalBalance.gt(initialBalance)).to.be.true;
    });
    
    it('Should allow owner to pause and unpause', async function() {
      // Pause the contract
      await cognisLogger.connect(owner).pause();
      
      const logFee = await cognisLogger.logFee();
      
      // Try to log while paused
      await expect(
        cognisLogger.connect(user1).logAgentInteraction(1, 'test', 'test', { value: logFee })
      ).to.be.revertedWith('Pausable: paused');
      
      // Unpause
      await cognisLogger.connect(owner).unpause();
      
      // Should work now
      await cognisLogger.connect(user1).logAgentInteraction(1, 'test', 'test', { value: logFee });
      
      expect(await cognisLogger.totalInteractions()).to.equal(1);
    });
  });
});

describe('BlockchainService', function() {
  // Mock the blockchain service for unit testing
  const { blockchainService } = require('../src/services/blockchain-service');
  
  let mockProvider;
  let mockSigner;
  let mockContract;
  
  beforeEach(function() {
    // Create mock provider, signer and contract
    mockProvider = {
      getBlockNumber: sinon.stub().resolves(12345),
      getNetwork: sinon.stub().resolves({ chainId: 31337, name: 'hardhat' }),
      getSigner: sinon.stub()
    };
    
    mockSigner = {
      getAddress: sinon.stub().resolves('0x1234567890123456789012345678901234567890')
    };
    
    mockContract = {
      logAgentInteraction: sinon.stub().resolves({ hash: '0xabcdef' }),
      logKnowledgeUpdate: sinon.stub().resolves({ hash: '0x123456' }),
      getUserStats: sinon.stub().resolves([5, 3]) // 5 interactions, 3 knowledge updates
    };
    
    // Replace real provider with mock
    blockchainService.provider = mockProvider;
    blockchainService.signer = mockSigner;
    blockchainService.cognisLoggerContract = mockContract;
    blockchainService.isConnected = true;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Connection', function() {
    it('Should return the blockchain status', async function() {
      const status = await blockchainService.getStatus();
      
      expect(status.connected).to.be.true;
      expect(status.blockNumber).to.equal(12345);
      expect(status.chainId).to.equal(31337);
      expect(status.networkName).to.equal('hardhat');
    });
    
    it('Should handle connection errors gracefully', async function() {
      mockProvider.getBlockNumber = sinon.stub().rejects(new Error('Connection failed'));
      
      const status = await blockchainService.getStatus();
      
      expect(status.connected).to.be.false;
      expect(status.blockNumber).to.equal(0);
    });
  });
  
  describe('Logging', function() {
    it('Should log agent interaction', async function() {
      const result = await blockchainService.logAgentInteraction(1, 'test', '{}');
      
      expect(result).to.equal('0xabcdef');
      expect(mockContract.logAgentInteraction.calledOnce).to.be.true;
    });
    
    it('Should log knowledge update', async function() {
      const result = await blockchainService.logKnowledgeUpdate(2, 'update', '{}');
      
      expect(result).to.equal('0x123456');
      expect(mockContract.logKnowledgeUpdate.calledOnce).to.be.true;
    });
    
    it('Should handle logging errors', async function() {
      mockContract.logAgentInteraction = sinon.stub().rejects(new Error('Test error'));
      
      const result = await blockchainService.logAgentInteraction(1, 'test', '{}');
      
      expect(result).to.be.null;
    });
  });
  
  describe('User Stats', function() {
    it('Should get user stats', async function() {
      const stats = await blockchainService.getUserStats('0x1234');
      
      expect(stats.interactions).to.equal(5);
      expect(stats.knowledgeUpdates).to.equal(3);
      expect(mockContract.getUserStats.calledOnce).to.be.true;
    });
    
    it('Should handle getUserStats errors', async function() {
      mockContract.getUserStats = sinon.stub().rejects(new Error('Test error'));
      
      const result = await blockchainService.getUserStats('0x1234');
      
      expect(result).to.be.null;
    });
  });
});

describe('Blockchain API Routes', function() {
  const request = require('supertest');
  const express = require('express');
  const app = express();
  const { blockchainService } = require('../src/services/blockchain-service');
  const blockchainRoutes = require('../src/routes/blockchain');
  
  // Set up the Express app with the blockchain routes
  app.use(express.json());
  app.use('/api/v1/blockchain', blockchainRoutes);
  
  beforeEach(function() {
    // Mock the blockchainService
    sinon.stub(blockchainService, 'getStatus').resolves({
      connected: true,
      blockNumber: 12345,
      chainId: 31337,
      networkName: 'hardhat',
      contractAddress: '0x1234567890123456789012345678901234567890'
    });
    
    sinon.stub(blockchainService, 'getUserStats').resolves({
      interactions: 5,
      knowledgeUpdates: 3
    });
    
    sinon.stub(blockchainService, 'logAgentInteraction').resolves('0xabcdef');
    
    sinon.stub(blockchainService, 'logKnowledgeUpdate').resolves('0x123456');
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('GET /status', function() {
    it('Should return blockchain status', async function() {
      const res = await request(app).get('/api/v1/blockchain/status');
      
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('success');
      expect(res.body.data.connected).to.be.true;
      expect(res.body.data.blockNumber).to.equal(12345);
    });
    
    it('Should handle errors', async function() {
      blockchainService.getStatus.restore();
      sinon.stub(blockchainService, 'getStatus').rejects(new Error('Test error'));
      
      const res = await request(app).get('/api/v1/blockchain/status');
      
      expect(res.status).to.equal(500);
      expect(res.body.status).to.equal('error');
    });
  });
  
  describe('GET /user-stats/:address', function() {
    it('Should return user stats', async function() {
      const res = await request(app).get('/api/v1/blockchain/user-stats/0x1234567890123456789012345678901234567890');
      
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('success');
      expect(res.body.data.interactions).to.equal(5);
      expect(res.body.data.knowledgeUpdates).to.equal(3);
    });
    
    it('Should validate Ethereum address', async function() {
      const res = await request(app).get('/api/v1/blockchain/user-stats/invalid-address');
      
      expect(res.status).to.equal(400);
      expect(res.body.status).to.equal('error');
    });
  });
  
  describe('POST /log-interaction', function() {
    it('Should log interaction', async function() {
      const res = await request(app)
        .post('/api/v1/blockchain/log-interaction')
        .send({
          agentId: 1,
          action: 'query',
          metadata: '{}'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('success');
      expect(res.body.data.transactionHash).to.equal('0xabcdef');
    });
    
    it('Should validate required fields', async function() {
      const res = await request(app)
        .post('/api/v1/blockchain/log-interaction')
        .send({
          action: 'query'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body.status).to.equal('error');
    });
  });
  
  describe('POST /log-knowledge-update', function() {
    it('Should log knowledge update', async function() {
      const res = await request(app)
        .post('/api/v1/blockchain/log-knowledge-update')
        .send({
          kbId: 1,
          action: 'update',
          metadata: '{}'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('success');
      expect(res.body.data.transactionHash).to.equal('0x123456');
    });
    
    it('Should validate required fields', async function() {
      const res = await request(app)
        .post('/api/v1/blockchain/log-knowledge-update')
        .send({
          action: 'update'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body.status).to.equal('error');
    });
  });
});
