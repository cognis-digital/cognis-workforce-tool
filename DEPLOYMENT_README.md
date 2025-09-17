# Cognis Workforce Tool - Production Deployment Guide
**September 16, 2025**

This document provides instructions for deploying the Cognis Workforce Tool to production environments.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/cognis-digital/cognis-workforce-tool.git
cd cognis-workforce-tool

# Checkout the production branch
git checkout production

# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
node serve-production.js
```

## Deployment Options

### 1. Node.js Server (Recommended)

The simplest deployment method is using the included Node.js server:

```bash
# Install dependencies and build
npm install
npm run build

# Start the production server (default port 8090)
node serve-production.js

# Or specify a custom port
PORT=3000 node serve-production.js
```

### 2. Docker Deployment

For containerized deployments:

```bash
# Build the Docker image
docker build -t cognis-workforce:latest .

# Run the container
docker run -p 8090:8090 cognis-workforce:latest
```

Or using docker-compose:

```bash
docker-compose up -d
```

### 3. GitHub Pages

The application is pre-configured for GitHub Pages deployment at `/cognis-workforce-tool/`.

## Base Path Configuration

**Important**: The application is built with a base path of `/cognis-workforce-tool/`. When serving the application locally or deploying to production, ensure the application is served from this base path.

### Asset URL Structure

All application assets must be served with the correct base path prefix:

```
/cognis-workforce-tool/            <- Base application URL
├── assets/                      <- Static assets directory
│   ├── index-XXXXXXXX.js        <- JavaScript bundles (hashed filenames)
│   ├── index-XXXXXXXX.css       <- CSS stylesheets (hashed filenames)
│   ├── runtime-XXXXXXXX.js      <- Runtime chunks
│   ├── models-XXXXXXXX.js       <- Model-related code
│   └── ort-wasm-*.wasm          <- WebAssembly binaries
├── models/                      <- ML model files directory
│   └── transformers/            <- Transformer models
└── vite.svg                     <- Favicon and other static assets
```

## Production Considerations

### 1. Environment Variables

The application supports the following environment variables:

- `PORT` - Server port (default: 8090)
- `NODE_ENV` - Environment (development/production)
- `MODEL_STORAGE_PATH` - Path to transformer models

### 2. WASM Support

The application uses WebAssembly (WASM) for client-side transformers. Ensure your hosting solution:

1. Sets the correct MIME type for `.wasm` files: `application/wasm`
2. Doesn't block WebAssembly execution
3. Has sufficient memory available for WASM operations

### 3. Security Headers

For production deployments, consider adding these security headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://api.cognis.ai; 
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: same-origin
```

## Troubleshooting

### Missing Assets or 404 Errors

If you encounter 404 errors:

1. Check that the application is served from `/cognis-workforce-tool/`
2. Verify assets are available in the correct directories
3. Inspect your web server logs for any MIME type issues with WASM files

### WASM Initialization Errors

If you see WASM-related errors in the console:

1. Check that the browser supports WebAssembly
2. Verify that all required WASM files are being served correctly
3. Ensure sufficient memory is available for WASM operations

## Support

For technical support, contact the infrastructure team at: infrastructure@cognis.digital

---

Last updated: September 16, 2025
