#!/bin/bash

# Cognis Workforce Tool - Mock Blockchain Startup Script
# This script starts a simplified mock blockchain for development

# Set up colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Cognis Workforce Tool - Mock Blockchain =====${NC}"

# Create logs directory if it doesn't exist
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

echo -e "${GREEN}Starting mock blockchain server...${NC}"
echo -e "${YELLOW}This will run on http://localhost:8545${NC}"

# Start the mock blockchain server
node blockchain-mock-server.js > logs/blockchain.log 2>&1 &
BLOCKCHAIN_PID=$!

# Wait a moment to ensure the server starts properly
sleep 2

# Check if the process is still running
if ps -p $BLOCKCHAIN_PID > /dev/null; then
  echo -e "${GREEN}✅ Mock blockchain is running with PID: ${BLOCKCHAIN_PID}${NC}"
  echo -e "${GREEN}✅ Logs are available in logs/blockchain.log${NC}"
  
  echo -e "\n${GREEN}=========================================${NC}"
  echo -e "${GREEN}Mock Blockchain Ready!${NC}"
  echo -e "${BLUE}RPC URL: ${NC}http://localhost:8545"
  echo -e "${BLUE}Chain ID: ${NC}31337"
  echo -e "${BLUE}Health Check: ${NC}http://localhost:8545/health"
  echo -e "${GREEN}=========================================${NC}"

  # Register a cleanup function
  cleanup() {
    echo -e "\n${YELLOW}Stopping mock blockchain...${NC}"
    kill $BLOCKCHAIN_PID
    echo -e "${GREEN}Mock blockchain stopped${NC}"
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
  echo -e "${RED}Failed to start mock blockchain. Check logs/blockchain.log for details${NC}"
  exit 1
fi
