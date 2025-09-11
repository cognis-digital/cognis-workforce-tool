#!/bin/bash

# Cognis Workforce Tool - Local Blockchain Startup Script
# This script starts a local Ethereum blockchain for development inside a webcontainer

# Set colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Cognis Workforce Tool - Local Blockchain =====${NC}"

# Check if npx is available
if ! command -v npx &> /dev/null; then
  echo -e "${RED}Error: npx is not installed${NC}"
  echo "Please install Node.js and npm before continuing"
  exit 1
fi

# Check if Hardhat is installed
if ! npx hardhat --version &> /dev/null; then
  echo -e "${YELLOW}Hardhat not found, installing required packages...${NC}"
  npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers@^5.7.2 @nomicfoundation/hardhat-chai-matchers
fi

# Create logs directory
mkdir -p logs

# Check for existing running blockchain
if lsof -i:8545 -t &> /dev/null; then
  echo -e "${YELLOW}A service is already running on port 8545${NC}"
  echo -e "You may need to stop the existing blockchain service first"
  read -p "Do you want to try to stop it and continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $(lsof -i:8545 -t) 2>/dev/null || true
    # Give it time to shut down
    sleep 2
  else
    echo -e "${YELLOW}Exiting without starting blockchain${NC}"
    exit 0
  fi
fi

echo -e "${GREEN}Starting local Ethereum blockchain...${NC}"
echo -e "${YELLOW}This will run on http://localhost:8545${NC}"

# Start Hardhat node with our CommonJS configuration for compatibility
HARDHAT_CONFIG=hardhat.config.cjs npx hardhat node --network weblocal > logs/blockchain.log 2>&1 &
BLOCKCHAIN_PID=$!

# Wait a moment to ensure the node starts properly
sleep 3

# Check if the process is still running
if ps -p $BLOCKCHAIN_PID > /dev/null; then
  echo -e "${GREEN}✓ Local blockchain is running with PID: ${BLOCKCHAIN_PID}${NC}"
  echo -e "Logs are available in logs/blockchain.log"

  # Deploy the contracts to the local blockchain
  echo -e "${BLUE}Deploying contracts to local blockchain...${NC}"
  HARDHAT_CONFIG=hardhat.config.cjs npx hardhat run scripts/deploy.js --network weblocal
  
  echo -e "\n${GREEN}=========================================${NC}"
  echo -e "${GREEN}Local Blockchain Ready!${NC}"
  echo -e "${BLUE}Network: ${NC}weblocal (Hardhat)"
  echo -e "${BLUE}RPC URL: ${NC}http://localhost:8545"
  echo -e "${BLUE}Chain ID: ${NC}31337"
  echo -e "${GREEN}=========================================${NC}"

  # Register a cleanup function
  cleanup() {
    echo -e "\n${YELLOW}Stopping local blockchain...${NC}"
    kill $BLOCKCHAIN_PID
    echo -e "${GREEN}Blockchain stopped${NC}"
    exit 0
  }

  # Trap SIGINT (Ctrl+C) and SIGTERM
  trap cleanup SIGINT SIGTERM

  # Keep the script running
  echo -e "\n${YELLOW}Press Ctrl+C to stop the blockchain${NC}"
  while true; do
    sleep 1
  done
else
  echo -e "${RED}Failed to start blockchain. Check logs/blockchain.log for details${NC}"
  exit 1
fi
