#!/bin/bash

# Cognis Workforce Tool - Production Deployment Script
# This script builds and deploys the application to production

set -e  # Exit on any error

echo "===== Starting Cognis Workforce Tool Production Deployment ====="

# Load environment variables from production env file
if [ -f ".env.production" ]; then
  # Make sure the file is not executable to prevent any commands from running
  chmod -x .env.production
  
  # Export variables manually rather than sourcing to avoid execution issues
  export $(grep -v '^#' .env.production | xargs -d '\n')
  echo "✅ Loaded production environment configuration"
else
  echo "⚠️ No .env.production file found, using defaults"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build frontend
echo "🏗️ Building frontend application..."
npm run build

# Setup directory structure for frontend-only deployment
echo "📁 Setting up directory structure..."
mkdir -p dist/web

# Copy static files
echo "📂 Copying static assets..."
cp -r dist/* dist/web/
cp -r public/* dist/web/
cp host-validator.js dist/web/
cp react-hook-injector.js dist/web/
cp react-polyfill.js dist/web/
cp component-fix.js dist/web/
cp env-config.js dist/web/
cp default-api-key.js dist/web/
cp -r api dist/web/

# Process transformer models for browser deployment
echo "🧠 Processing transformer models for client-side deployment..."
mkdir -p dist/web/models/transformers

# Function to process a model directory
process_model() {
  local model_dir=$1
  local model_name=$(basename "$model_dir")
  
  echo "  - Processing $model_name..."
  mkdir -p "dist/web/models/transformers/$model_name"
  
  # Copy model config and tokenizer
  cp -r "$model_dir/config.json" "dist/web/models/transformers/$model_name/"
  cp -r "$model_dir/tokenizer.json" "dist/web/models/transformers/$model_name/"
  
  # Check if model file exists (may not exist in dev environment)
  if [ -f "$model_dir/model.onnx" ]; then
    echo "    • Found model file, processing chunks..."
    
    # Create model chunks directory
    mkdir -p "dist/web/models/transformers/$model_name/chunks"
    
    # Split model into chunks (using Node.js script)
    node scripts/chunk-model.js "$model_dir/model.onnx" "dist/web/models/transformers/$model_name/chunks"
    
    # Create merkle metadata file
    node scripts/create-merkle-metadata.js "$model_dir/model.onnx" "dist/web/models/transformers/$model_name/merkle_metadata.json"
  else
    echo "    • Model file not found, creating placeholder..."
    echo '{"placeholder": true, "message": "Model file not included in repository due to size limitations"}' > "dist/web/models/transformers/$model_name/model_placeholder.json"
  fi
}

# Process each transformer model
for model_dir in public/models/transformers/*; do
  if [ -d "$model_dir" ]; then
    process_model "$model_dir"
  fi
done

echo "✅ Transformer models processed successfully"

# Copy environment file for production
echo "⚙️ Setting up environment configuration..."
cp .env.production dist/.env

# Create startup script for static file server
cat > dist/start.sh << 'EOL'
#!/bin/bash
# Cognis Workforce Tool - Static Server Startup Script

# Set working directory
cd "$(dirname "$0")"

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 18 or later."
  exit 1
fi

# Default port
PORT=${PORT:-8080}

# Check if http-server is installed
if ! command -v npx &> /dev/null; then
  echo "❌ npx is not installed. Please install Node.js 18 or later with npm."
  exit 1
fi

# Start a simple HTTP server
echo "🚀 Starting Cognis Workforce Tool static server on port $PORT..."
cd web
npx http-server -p $PORT --cors -o
EOL

# Make startup script executable
chmod +x dist/start.sh

# Create README for deployment
cat > dist/README.md << 'EOL'
# Cognis Workforce Tool - Frontend Deployment

This is a frontend-only deployment of the Cognis Workforce Tool with static file serving.

## Getting Started

1. Ensure Node.js 18+ is installed on your system
2. Run `./start.sh` to start the static file server
3. Access the application at http://localhost:8080 (or your configured port)

## Configuration

The following environment variables can be configured:

- `PORT`: The port to run the static server on (default: 8080)

## Features

- Frontend-only deployment with static file serving
- Mock API responses for demonstration purposes
- No backend server required

## Troubleshooting

- If you see "Loading..." indefinitely, check browser console for errors
- For host validation errors, ensure the host-validator.js file was correctly copied
- To resolve React hooks errors, verify react-hook-injector.js is properly loaded

## Note

This is a demo deployment with mocked API responses. For production use, configure a proper backend server.
EOL

echo "✅ Deployment package created successfully!"
echo "📁 Your deployment package is ready in the 'dist' directory"
echo "🚀 To start the application, run: ./dist/start.sh"
