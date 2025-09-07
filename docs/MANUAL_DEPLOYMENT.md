# Manual Deployment Instructions for Evolution Architecture

This guide provides step-by-step instructions for manually deploying the Cognis Digital Evolution Architecture when GitHub Actions automated deployments are not available or encountering issues.

## Prerequisites

- Node.js 20.19.0 or later
- npm 10.x or later
- Access to staging and production environments
- SSH access to deployment servers (if applicable)
- Necessary environment variables and credentials

## Deployment Process

### 1. Environment Setup

1. Clone the repository (if not already done):
   ```bash
   git clone https://github.com/cognis-digital/cognis-workforce-tool.git
   cd cognis-workforce-tool
   ```

2. Create environment configuration files:
   ```bash
   cp .env.example .env.staging
   cp .env.example .env.production
   ```

3. Edit the environment files to include the correct values for each environment:
   ```bash
   # Edit staging environment variables
   nano .env.staging
   
   # Edit production environment variables
   nano .env.production
   ```

### 2. Build Process

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run tests to ensure everything is working:
   ```bash
   npm test -- --coverage --watchAll=false
   ```

3. Build for staging environment:
   ```bash
   NODE_ENV=staging node scripts/configure-env.js
   npm run build
   ```

### 3. Staging Deployment

1. Deploy to staging server using your preferred method (examples below):

   **Option 1: Using rsync:**
   ```bash
   rsync -avz --delete ./build/ user@staging-server:/var/www/cognis-digital/
   ```

   **Option 2: Using scp:**
   ```bash
   scp -r ./build/* user@staging-server:/var/www/cognis-digital/
   ```

   **Option 3: Using Netlify CLI:**
   ```bash
   npx netlify deploy --dir=build --site=your-netlify-site-id
   ```

2. Verify the deployment by checking:
   - The staging URL loads correctly
   - The Evolution Architecture features are functional
   - No console errors are present

### 4. Production Deployment

1. After verifying the staging deployment, build for production:
   ```bash
   NODE_ENV=production node scripts/configure-env.js
   npm run build
   ```

2. Deploy to production server:

   **Option 1: Using rsync:**
   ```bash
   rsync -avz --delete ./build/ user@production-server:/var/www/cognis-digital/
   ```

   **Option 2: Using scp:**
   ```bash
   scp -r ./build/* user@production-server:/var/www/cognis-digital/
   ```

   **Option 3: Using Netlify CLI:**
   ```bash
   npx netlify deploy --dir=build --site=your-netlify-site-id --prod
   ```

### 5. Post-Deployment Verification

1. Verify the Evolution Architecture components are working:
   - Time-series state management
   - Polymorphic code generation
   - Adaptive UI components
   - Blockchain integration (if enabled)

2. Run monitoring checks:
   ```bash
   curl -s https://app.cognisdigital.com/api/health | grep -q "ok" && echo "Health check passed" || echo "Health check failed"
   ```

## Rollback Procedure

If issues are encountered after deployment, follow these steps to roll back:

1. Identify the last stable version:
   ```bash
   git log --oneline -10
   ```

2. Checkout the stable version:
   ```bash
   git checkout <commit-hash>
   ```

3. Follow the build and deployment steps above to deploy the stable version.

## Deployment Architecture Overview

The Cognis Digital Evolution Architecture consists of several key components that need to be deployed together:

1. **Core Components**:
   - Time-Series Store
   - Polymorphic Code Generator
   - State Analysis Engine
   - Application Evolution Manager

2. **Implementation Modules**:
   - User Credentials System
   - RBAC System
   - AI Chat Interface
   - Knowledge Stack
   - Lead Generation
   - Wallet Connect

All these components are bundled together during the build process and should be deployed as a single unit.

## Troubleshooting

### Common Issues

1. **Missing Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Environment Variable Issues**:
   ```bash
   node scripts/configure-env.js --debug
   ```

3. **Build Failures**:
   ```bash
   # Clean node_modules and reinstall
   rm -rf node_modules
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

4. **Blockchain Connection Issues**:
   ```bash
   # Check blockchain connectivity
   curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' https://ethereum.infura.io/v3/your-infura-key
   ```

## Contact Information

For deployment issues, contact:

- Engineering Lead: engineering@cognisdigital.com
- DevOps Team: devops@cognisdigital.com
