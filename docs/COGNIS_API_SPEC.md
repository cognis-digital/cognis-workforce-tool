# Cognis API Backend

This document describes the Cognis API implementation for the Cognis Workforce Tool.

## Overview

The Cognis API Backend provides a robust, secure API interface that:

1. Implements the complete Cognis API specification
2. Supports POST methods for all data manipulation endpoints
3. Returns appropriate errors for incorrect request methods
4. Maintains consistent response formats with Cognis API standards
5. Provides secure API key management

## Supported Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat/completions` | POST | Chat completions with full streaming support |
| `/api/v1/embeddings` | POST | Vector embeddings generation |
| `/api/v1/images/generations` | POST | Image generation |
| `/api/v1/health` | GET | Server health check |

## Authentication

All endpoints except `/health` require authentication using an API key in the Bearer token format:

```
Authorization: Bearer sk-cognis-xxxxxxxxxxxxxxxx
```

The API server accepts the following API keys:
- The development API key: `sk-cognis-workforce-tool-dev-key-12345`
- The configured API key in environment variables

## Request/Response Format

### Chat Completions

**Request:**
```json
POST /api/v1/chat/completions
{
  "model": "Cognis-Zenith-4.0",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello world"}
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1694182397,
  "model": "Cognis-Zenith-4.0",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
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

### Streaming Response Format

When `stream: true` is set, the response is sent as server-sent events (SSE) in this format:

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1694182397,"model":"Cognis-Zenith-4.0","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1694182397,"model":"Cognis-Zenith-4.0","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1694182397,"model":"Cognis-Zenith-4.0","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Embeddings

**Request:**
```json
POST /api/v1/embeddings
{
  "model": "text-embedding-ada-002",
  "input": "The quick brown fox jumps over the lazy dog"
}
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.1, 0.2, /* ... more dimensions */ ],
      "index": 0
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 9
  }
}
```

## Error Handling

All errors follow the OpenAI error format:

```json
{
  "error": {
    "message": "Error message here",
    "type": "invalid_request_error",
    "param": null,
    "code": "method_not_allowed"
  }
}
```

Common error types include:
- `authentication_error`: Issues with API key
- `invalid_request_error`: Malformed requests or invalid methods
- `server_error`: Internal server errors

HTTP status codes:
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (missing API key)
- 403: Forbidden (invalid API key)
- 404: Not Found (invalid endpoint)
- 405: Method Not Allowed (wrong HTTP method)
- 500: Server Error

## Testing the API

A test script is included to verify API functionality:

```bash
# Run with default settings
./test-api.sh

# Specify custom API URL and key
./test-api.sh --url http://localhost:3000/api/v1 --key sk-your-api-key
```

## Integration with Frontend

The frontend integrates with this API through the `cognisBackend.ts` service, which handles:
1. Authentication
2. Request formatting
3. Response parsing
4. Error handling
5. Streaming support

The service automatically detects whether it's running in development or production mode and adjusts the API endpoint accordingly.

## Development Mode

In development mode (or when using the development API key), the server provides mock responses that match the OpenAI format, allowing for testing without a real API key.

## Starting the Server

To start the server, use the provided script:

```bash
./start-cognis-api-server.sh
```

This script will:
1. Check for dependencies and install them if needed
2. Create a default environment configuration if none exists
3. Start the server on the configured port (default: 3000)

## Troubleshooting

If you see "Cannot GET /api/v1/chat/completions" or "Cannot GET /api/v1/embeddings" errors, remember that these endpoints only accept POST requests. For GET requests, the server will return a 405 Method Not Allowed error.
