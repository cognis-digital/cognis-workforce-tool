# Cognis Workforce Tool - Deployment Readiness Guide
**September 16, 2025**

## Deployment Status

All core components are ready for production deployment with specific attention to:

1. WASM Integration for Local AI Agents
2. Component boundary issues fixed
3. CI/CD deployment workflows configured

## Quick Start

```bash
# Clone the repository (if needed)
git clone https://github.com/cognis-digital/cognis-workforce-tool.git

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

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

If you deploy to a different path, you will need to rebuild the application with the correct base path in `vite.config.ts`.

### Using the Custom Server Script

For local testing with the correct base path:

```bash
# Install Express (if not already installed)
npm install express

# Run the custom server script
node serve-local.js

# Access the application at
# http://localhost:8090/cognis-workforce-tool
```

### Troubleshooting Path Issues

If you encounter 404 errors for assets:

1. Check that all assets are being served from `/cognis-workforce-tool/assets/`
2. Verify that the application is being accessed via the `/cognis-workforce-tool` path
3. Ensure the server is properly configured to handle client-side routing

## Deployment Options

### GitHub Actions (Recommended)

The GitHub Actions workflows are fully configured and ready:

1. **Standard Deployment**: Use `deploy.yml` for staging deployments
   - Automatically triggered on pushes to `main`
   - Manually triggerable with environment selection

2. **Production Deployment**: Use `production-deploy.yml` for production
   - Automatically triggered on pushes to `production` branch
   - Creates a versioned release artifact
   - Deploys to GitHub Pages automatically

### Manual Deployment

If GitHub Actions is unavailable, use:

```bash
# Build for production
npm run build

# Deploy using the script
./deploy-production.sh
```

## WASM Model Testing

The application now includes built-in WASM diagnostics to verify proper operation:

1. Navigate to the "Local Agents" page (`/local-agents` route)
2. The page will automatically run diagnostics showing:
   - WASM support status
   - Memory allocation test
   - ONNX Runtime initialization
   
If any diagnostics fail, check browser console for detailed error messages.

## Recent Fixes

### Console Error Fixes

1. **React Component Errors**
   - Fixed Ant Design component references
   - Resolved nested component boundaries
   - Fixed type definitions

2. **WASM Configuration**
   - Added proper WebAssembly initialization
   - Configured Vite for WASM file handling
   - Added top-level await support

3. **Model Loading**
   - Added robust error handling
   - Fixed async initialization
   - Added support detection

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 102+    | Full    |
| Firefox | 98+     | Full    |
| Safari  | 16.4+   | Partial* |
| Edge    | 102+    | Full    |

*Safari has limited SharedArrayBuffer support which may affect threading performance.

## Post-Deployment Verification

After deployment, verify:

1. **Core Functionality**: Check the main Workforce Tool features
2. **WASM Support**: Verify Local AI Agents page loads correctly
3. **API Integration**: Confirm API endpoints are correctly proxied
4. **UI Components**: Verify all Ant Design components render properly

## Troubleshooting

### Common Issues

1. **"WebAssembly not supported"**: Ensure browser is up-to-date and supports WASM
2. **API Connection Errors**: Check Vite proxy configuration in `vite.config.ts`
3. **Model Loading Failures**: Verify models directory structure is correct
4. **UI Rendering Issues**: Check for missing Ant Design components

### Emergency Rollback

If critical issues are detected in production:

1. Use the GitHub Actions workflow `rollback.yml`
2. Alternatively, manually restore from the latest known good release:
   ```bash
   git checkout production-[previous-version]
   ./deploy-production.sh
   ```

## Next Steps

1. Monitor performance metrics after deployment
2. Gather user feedback on the WASM model performance
3. Plan optimizations for the next sprint

---

**Contact**: For urgent deployment issues, contact the infrastructure team via Slack (#cognis-infra).
