# Cognis API Backend

A secure backend service that provides a seamless interface between frontend applications and Cognis AI services. This API server handles authentication, request validation, caching, and provides additional features like rate limiting and usage analytics.

## Features

- **Secure API Key Management**: Store and validate API keys for accessing Cognis AI services
- **OpenAI-compatible API**: Compatible endpoints with OpenAI's API structure
- **Streaming Support**: Real-time streaming responses for chat completions
- **Rate Limiting**: Prevent abuse by limiting request rates
- **Caching**: Improve performance with response caching
- **Usage Tracking**: Monitor API usage and token consumption
- **Mock Responses**: Development mode with mock responses when no API key is available
- **Comprehensive Logging**: Detailed logging for debugging and auditing
- **TypeScript**: Type-safe implementation for better developer experience

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/cognis-api.git
cd cognis-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.development
```

4. Edit the `.env.development` file to add your Cognis API key and other configuration options.

### Development

Start the development server:
```bash
npm run dev
```

The server will be available at http://localhost:3000.

## API Endpoints

### Authentication

#### Generate API Key

```http
POST /auth/api-keys
```

Request body:
```json
{
  "owner": "UserName",
  "description": "API key for development"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "apiKey": "sk-cognis-xxxxxxxxxxxxxxxx",
    "owner": "UserName",
    "createdAt": "2025-09-07T12:00:00.000Z"
  }
}
```

#### Verify API Key

```http
GET /auth/verify
```

Headers:
```
Authorization: Bearer sk-cognis-xxxxxxxxxxxxxxxx
```

Response:
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "owner": "UserName",
    "createdAt": "2025-09-07T12:00:00.000Z"
  }
}
```

### Cognis AI Services

#### Chat Completions

```http
POST /api/v1/chat/completions
```

Headers:
```
Authorization: Bearer sk-cognis-xxxxxxxxxxxxxxxx
Content-Type: application/json
```

Request body:
```json
{
  "model": "Cognis-Zenith-4.0",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello world!" }
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "stream": false
}
```

Response:
```json
{
  "id": "chatcmpl-123abc",
  "object": "chat.completion",
  "created": 1694182397,
  "model": "Cognis-Zenith-4.0",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm a helpful assistant powered by Cognis AI. How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 23,
    "completion_tokens": 18,
    "total_tokens": 41
  }
}
```

#### Embeddings

```http
POST /api/v1/embeddings
```

Headers:
```
Authorization: Bearer sk-cognis-xxxxxxxxxxxxxxxx
Content-Type: application/json
```

Request body:
```json
{
  "model": "Cognis-Nova-3.0",
  "input": "The quick brown fox jumps over the lazy dog."
}
```

Response:
```json
{
  "object": "list",
  "data": [
    {
      "embedding": [0.1, 0.2, ..., 0.9],
      "index": 0
    }
  ],
  "model": "Cognis-Nova-3.0",
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 9
  }
}
```

#### Image Generation

```http
POST /api/v1/images/generate
```

Headers:
```
Authorization: Bearer sk-cognis-xxxxxxxxxxxxxxxx
Content-Type: application/json
```

Request body:
```json
{
  "prompt": "A cute cat playing with a ball of yarn",
  "n": 1,
  "size": "1024x1024",
  "response_format": "url"
}
```

Response:
```json
{
  "created": 1694182397,
  "data": [
    {
      "url": "https://api.cognis.com/images/cute-cat.jpg"
    }
  ]
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port to run the server on | 3000 |
| NODE_ENV | Environment (development, production) | development |
| API_VERSION | API version | v1 |
| COGNIS_API_KEY | Your Cognis API key | - |
| COGNIS_API_URL | Cognis API base URL | https://api.cognisdigital.com/v1 |
| COGNIS_DEFAULT_MODEL | Default model to use | Cognis-Zenith-4.0 |
| JWT_SECRET | Secret for JWT tokens | change_this_in_production |
| CORS_ORIGIN | Allowed origins for CORS | * |
| RATE_LIMIT_WINDOW_MS | Rate limit window in milliseconds | 900000 |
| RATE_LIMIT_MAX | Maximum requests per window | 100 |
| LOG_LEVEL | Logging level | info |

## Deployment

### Using Docker

1. Build the Docker image:
```bash
docker build -t cognis-api .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env.production cognis-api
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Automated Deployment

Use the deployment script:
```bash
./deploy.sh [environment]
```

Where `environment` is either `production` or `staging`. The script will build the application, create a deployment package, and deploy it to the specified environment.

## Development Guidelines

### Project Structure

```
cognis-api/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   └── index.ts        # Entry point
├── dist/               # Compiled code
├── tests/              # Test files
├── .env.example        # Example environment variables
├── .env.development    # Development environment variables
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
└── README.md           # Documentation
```

### Adding New Endpoints

1. Define route handler in `src/routes/`
2. Implement controller logic in `src/controllers/`
3. Add business logic in `src/services/`
4. Update documentation

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
