#!/bin/bash

# Cognis Workforce Tool - Server Startup Script
# This shell script is a more robust way to start the server

# Load environment variables
if [ -f ".env" ]; then
  source .env
elif [ -f ".env.development" ]; then
  source .env.development
else
  source .env.example
fi

echo "Starting Cognis Workforce Tool server..."

# Use npx to run ts-node with proper flags
npx ts-node-esm --skipProject server/index.ts

# Exit with the same status code as the server
exit $?
