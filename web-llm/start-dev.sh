#!/bin/bash
# Startup script for the Local LLM application development environment

echo "🧠 Starting Cognis Local LLM Development Environment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

# Check for .env file, create if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating default .env file..."
    cat > .env << 'EOL'
PORT=8080
BACKEND=local
MODEL_ID=Xenova/TinyLlama-1.1B-Chat-v1.0
MAX_TOKENS=256
TEMP=0.7
WASM_THREADS=2
CTX_WINDOW=1024
MODEL_CACHE_DIR=.model-cache
OPENAI_API_KEY=
EOL
    echo "✅ .env file created"
fi

# Create model cache directory if it doesn't exist
mkdir -p .model-cache

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Start the development server
echo "🚀 Starting development server..."
echo "👉 Server API: http://localhost:8080/api"
echo "👉 Frontend UI: http://localhost:5173"
echo "⚡ Press Ctrl+C to stop"

# Use concurrently to start both server and frontend
npm run dev
