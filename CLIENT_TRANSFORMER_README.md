# Client-Side Transformer Implementation

## Overview

This document provides details on the client-side transformer implementation with Merkle verification integrated into the Cognis Workforce Tool.

## Components

### 1. Client-Side Transformer UI

The UI component (`ClientTransformer.tsx`) provides a user interface for:
- Selecting transformer models
- Running inference directly in the browser
- Training capabilities for supported models
- Integration with Cognis Research AI

### 2. ONNX Runtime Integration

Models are executed directly in the browser using ONNX Runtime Web:
- Supports inference with minimal latency
- Enables privacy-preserving computation
- Optimized for various device capabilities

### 3. Merkle Tree Verification

Model integrity is verified using Merkle trees:
- Models are chunked for efficient loading
- Each chunk is verified against a Merkle root
- Ensures model integrity during loading

## Directory Structure

```
cognis-workforce-tool/
├── src/
│   ├── components/
│   │   └── ClientTransformer.tsx     # UI component
│   ├── utils/
│   │   ├── onnxModel.ts              # ONNX model wrapper
│   │   ├── merkleTree.ts             # Merkle tree implementation
│   │   └── researchAIConnector.ts    # Integration with Research AI
│   └── config/
│       └── transformerModels.ts      # Model registry configuration
├── public/
│   └── models/
│       └── transformers/             # Model storage directory
│           ├── cognis-tiny-transformer/
│           ├── cognis-small-transformer/
│           └── cognis-research-assistant/
└── scripts/
    ├── chunk-model.js                # Model chunking script
    └── create-merkle-metadata.js     # Merkle metadata generation
```

## Deployment Process

The deployment process is handled by `deploy-production.sh`, which:
1. Builds the application
2. Processes transformer models:
   - Splits models into chunks
   - Generates Merkle metadata
3. Copies all assets to the distribution directory
4. Creates a deployable package

## Adding New Models

To add a new transformer model:

1. Create a directory in `public/models/transformers/{model-name}/`
2. Add model files:
   - `model.onnx`: The ONNX model file
   - `config.json`: Model configuration
   - `tokenizer.json`: Tokenizer configuration
3. Update `src/config/transformerModels.ts` with new model metadata
4. Run deployment script to process the model

## Usage with Research AI

The client-side transformer integrates with Cognis Research AI:

1. Local models are used for smaller queries for privacy and speed
2. Complex queries are routed to the server for processing
3. Hybrid approach uses local models first, then enhances results with server

## Troubleshooting

### Browser Compatibility

- WebAssembly support is required for ONNX Runtime Web
- Chrome, Firefox, Safari, and Edge (modern versions) are supported
- Mobile browsers with sufficient memory are supported

### Memory Issues

- Large models may require significant memory
- The system automatically checks device capabilities
- Models are loaded on-demand to minimize memory usage

### API Connectivity

- If API calls fail, check the Vite proxy configuration
- Ensure the backend API is running
- CORS issues are handled by the Vite proxy configuration

## Development

To run the application locally with transformer models:

```bash
npm run cognis:dev
```

The application will be available at http://localhost:5173
