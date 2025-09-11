#!/bin/bash

# Cognis API Backend Server - Startup Script
# This script starts the OpenAI-compatible Cognis API Server

# Set colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Cognis API Server - Startup =====${NC}"

# Change to the cognis-api directory
cd "$(dirname "$0")/cognis-api" || {
  echo -e "${RED}Error: Could not find cognis-api directory${NC}"
  exit 1
}

# Check if .env.development exists, if not create it
if [ ! -f ".env.development" ]; then
  echo -e "${YELLOW}No .env.development file found, creating a default one...${NC}"
  cat > .env.development << EOL
# Development environment for Cognis API Server
PORT=3000
NODE_ENV=development
API_VERSION=v1
COGNIS_API_KEY=sk-cognis-workforce-tool-dev-key-12345
COGNIS_API_URL=https://api.cognisdigital.com/v1
COGNIS_DEFAULT_MODEL=Cognis-Zenith-4.0
CORS_ORIGIN=*
LOG_LEVEL=debug
EOL
  echo -e "${GREEN}Created .env.development file${NC}"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Create logs directory
mkdir -p logs

# Start the server
echo -e "${BLUE}Starting Cognis API Server...${NC}"
NODE_ENV=development npx ts-node src/index.ts 2>&1 | tee -a logs/server.log

# This script will keep running until the server is stopped with Ctrl+C
