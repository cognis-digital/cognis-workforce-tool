#!/bin/bash

# Cognis Workforce Tool - Development Startup Script
# This script starts the frontend and backend servers for development

# Set up colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Cognis Workforce Tool - Development Environment =====${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18 or later.${NC}"
  exit 1
fi

# Load environment variables
if [ -f ".env.development" ]; then
  source .env.development
  echo -e "${GREEN}✅ Loaded development environment configuration${NC}"
else
  echo -e "${YELLOW}⚠️ No .env.development file found, creating one with default values...${NC}"
  cat > .env.development << EOL
# Development environment for Cognis Workforce Tool
PORT=8080
BACKEND=cognis
COGNIS_API_KEY=sk-cognis-workforce-tool-dev-key-12345
COGNIS_API_URL=https://api.cognisdigital.com/v1
COGNIS_DEFAULT_MODEL=Cognis-Zenith-4.0
EOL
  source .env.development
  echo -e "${GREEN}✅ Created default development environment file${NC}"
fi

# Check port availability
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️ Port $PORT is already in use. Trying alternate port 3030...${NC}"
    PORT=3030
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $PORT is also in use. Please close other applications or manually set PORT in .env.development${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Using alternate port $PORT${NC}"
fi

# Start the server
echo -e "${BLUE}🚀 Starting Cognis API Backend Server...${NC}"
PORT=$PORT NODE_ENV=development node server.js &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Check if the server started successfully
if ! ps -p $SERVER_PID > /dev/null; then
  echo -e "${RED}❌ Failed to start the server. Check the logs above for errors.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Cognis API Backend Server running at http://localhost:$PORT${NC}"
echo -e "${GREEN}✅ API endpoint available at http://localhost:$PORT/api/v1${NC}"
echo -e "${GREEN}✅ Health check endpoint: http://localhost:$PORT/api/v1/health${NC}"

# Start the frontend development server
echo -e "${BLUE}🚀 Starting Frontend Development Server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Setup trap to kill both processes on exit
trap "kill $SERVER_PID $FRONTEND_PID 2>/dev/null" EXIT

# Show friendly information
echo -e "${YELLOW}
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Cognis Workforce Tool - Development Environment           │
│                                                             │
│   API Server:          http://localhost:$PORT                │
│   Frontend Server:     Check above for URL                  │
│                                                             │
│   API Backend Mode:    $BACKEND                              │
│   API Health:          http://localhost:$PORT/api/v1/health  │
│                                                             │
│   Press Ctrl+C to stop all servers                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
${NC}"

# Wait for user to press Ctrl+C
wait
