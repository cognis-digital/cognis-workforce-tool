# Cognis API Server Documentation

## Overview
The Cognis API Server is a backend service that provides a secure way to access the Cognis AI API. It solves the issue of exposing API keys in frontend code by acting as a proxy between your frontend application and the Cognis API.

## Key Features
- Secure API key handling - API keys are stored server-side, not exposed to clients
- Compatible with Cognis API endpoints (`/chat/completions`, `/embeddings`)
- Authentication and request logging
- Automatic port detection to avoid conflicts
- Support for streaming responses
- Cross-origin request support (CORS)
- Both TypeScript and JavaScript implementations

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
1. Clone the repository
2. Set up environment variables in `.env.development` (or `.env` for production)
3. Run `npm install` to install dependencies

### Environment Configuration
Create a `.env.development` file with these variables:
```
# API configuration
PORT=8080
BACKEND=cognis
COGNIS_API_KEY=your-api-key-here
COGNIS_API_URL=https://api.cognisdigital.com/v1
```

## Running the Server

### Simple JavaScript Server
The easiest way to run the server is with:
```bash
npm run cognis:api
```

This starts the simplified JavaScript server that:
- Automatically finds an available port
- Provides basic request logging
- Proxies requests to the Cognis API

### Development Mode
For development with auto-reloading:
```bash
npm run cognis:api:dev
```

### TypeScript Server
For the full TypeScript implementation:
```bash
npm run cognis:server
```

## Deployment

### Production Deployment
To deploy to production:
1. Set up environment variables in `.env.production`
2. Build and deploy:
```bash
npm run cognis:deploy
```

This will:
- Build the frontend
- Compile TypeScript server code
- Create a deployment package in the `dist` directory

### Running in Production
```bash
npm run cognis:start
```

## API Endpoints

### Health Check
```
GET /api/v1/health
```
Returns status information about the API server.

### Chat Completions
```
POST /api/v1/chat/completions
```
Proxies to Cognis API's chat completions endpoint. Supports streaming.

Example request:
```json
{
  "model": "Cognis-Zenith-4.0",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello world" }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

### Embeddings
```
POST /api/v1/embeddings
```
Proxies to Cognis API's embeddings endpoint.

Example request:
```json
{
  "model": "Cognis-Nova-3.0",
  "input": "The quick brown fox jumps over the lazy dog."
}
```

## Frontend Integration

The frontend service (`src/services/cognis.ts`) has been updated to connect to the local API server instead of directly to the Cognis API. This service automatically detects if it's running in self-hosted mode and adjusts the API endpoint accordingly.

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, the server will automatically try the next available port. You can also specify a different port in the environment variables:
```
PORT=3000
```

### Authentication Issues
For local development, authentication is bypassed for requests from localhost. In production, requests should include an `Authorization: Bearer your-api-key` header.

### API Key Not Found
If you see "API key not found" errors, check that:
1. The `COGNIS_API_KEY` environment variable is set
2. The frontend is correctly configured to use the backend API server
3. For self-hosted mode, the server is running properly

## License
This project is licensed under the terms of the internal Cognis Digital license.
