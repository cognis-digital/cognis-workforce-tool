#!/bin/bash

# Cognis Workforce Tool - Complete Application Launcher
# This script starts both the frontend and backend services

# Set up colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Cognis Workforce Tool - Complete Application Launcher =====${NC}"

# Check if the necessary directories exist
if [ ! -d "cognis-api" ]; then
  echo -e "${RED}Error: cognis-api directory not found${NC}"
  echo "Please make sure you are in the correct directory and the cognis-api folder exists"
  exit 1
fi

# Function to handle cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Create log directory if it doesn't exist
mkdir -p logs

# Load environment variables
if [ -f ".env.development" ]; then
  source .env.development
  echo -e "${GREEN}✅ Loaded development environment${NC}"
else
  echo -e "${YELLOW}⚠️ No .env.development file found, using defaults${NC}"
fi

# Start the backend API server
echo -e "${BLUE}🚀 Starting Cognis API Backend Server...${NC}"
(cd cognis-api && npm run dev) > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend server to start...${NC}"
sleep 3

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
  echo -e "${RED}❌ Failed to start backend server. Check logs/backend.log for errors${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"

# Start the frontend dev server
echo -e "${BLUE}🚀 Starting Frontend Development Server...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend server to start...${NC}"
sleep 5

# Check if frontend started successfully
if ! ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${RED}❌ Failed to start frontend server. Check logs/frontend.log for errors${NC}"
  cleanup
fi

echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"

# Get backend port from environment or default
BACKEND_PORT=${PORT:-3000}

# Wait for both servers to be available
echo -e "${BLUE}🔍 Checking server availability...${NC}"

# Wait for backend to be available
BACKEND_READY=false
for i in {1..10}; do
  if curl -s http://localhost:$BACKEND_PORT/api/v1/health > /dev/null; then
    BACKEND_READY=true
    break
  fi
  echo -e "${YELLOW}⏳ Waiting for backend server to be ready... ($i/10)${NC}"
  sleep 2
done

if [ "$BACKEND_READY" = false ]; then
  echo -e "${RED}❌ Backend server is not responding. Please check logs/backend.log${NC}"
  echo -e "${YELLOW}Continuing anyway...${NC}"
fi

# Show running services
echo -e "\n${GREEN}=================================${NC}"
echo -e "${GREEN}  Cognis Workforce Tool Running  ${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${BLUE}Backend API:${NC} http://localhost:$BACKEND_PORT/api/v1"
echo -e "${BLUE}Frontend:${NC} Check above for URL (typically http://localhost:5173)"
echo -e "${BLUE}API Health:${NC} http://localhost:$BACKEND_PORT/api/v1/health"
echo -e "${BLUE}Logs:${NC} ./logs/backend.log and ./logs/frontend.log"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Keep the script running
while true; do
  # Check if servers are still running
  if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
    cleanup
  fi
  
  if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
    cleanup
  fi
  
  sleep 5
done
