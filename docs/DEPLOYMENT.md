# Evolution Architecture Deployment Guide

This document provides instructions for deploying the Cognis Digital Evolution Architecture using GitHub Actions.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Procedures](#deployment-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring and Verification](#monitoring-and-verification)

## Deployment Overview

The Evolution Architecture deployment is fully automated using GitHub Actions. The system supports:

- Continuous deployment to staging on every push to the master branch
- Manual triggered deployments to production
- Automated testing and verification
- Version tagging and release management
- Emergency rollback procedures

## GitHub Actions Workflows

### Main Deployment Workflow: `evolution-deploy.yml`

This workflow handles the build, test, and deployment process:

- **Triggers**: Automatically on pushes to master branch, or manually via workflow dispatch
- **Environments**: Staging and Production
- **Key Steps**:
  - Build the Evolution Architecture components
  - Run unit and integration tests
  - Create version tags
  - Deploy to staging automatically
  - Deploy to production when manually triggered

### Environment Setup: `environment-setup.yml`

This workflow handles environment-specific configuration:

- **Purpose**: Sets up environment variables securely for different deployment targets
- **Usage**: Called by the main deployment workflow
- **Security**: Uses GitHub Secrets for sensitive configuration values

### Rollback Workflow: `rollback.yml`

This workflow enables emergency rollbacks to previous versions:

- **Trigger**: Manual workflow dispatch
- **Inputs**: Target version and environment
- **Process**: Validates target version, rebuilds from that version, and deploys

## Environment Configuration

Environment variables are managed through multiple mechanisms:

1. **`.env` files**: Environment-specific configurations (staging, production)
2. **GitHub Secrets**: Sensitive credentials and API keys
3. **Runtime Configuration**: Generated during deployment

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_URL` | Cognis API endpoint URL | Yes |
| `COGNIS_MODEL_ENDPOINT` | Endpoint for Cognis AI models | Yes |
| `AUTH_DOMAIN` | Authentication domain | Yes |
| `COGNIS_ZENITH_VERSION` | Version of Cognis-Zenith model to use | No |
| `COGNIS_APEX_VERSION` | Version of Cognis-Apex model to use | No |
| `COGNIS_VERTEX_VERSION` | Version of Cognis-Vertex model to use | No |

### Setting Up Environment Variables

1. Copy `.env.example` to create `.env.production` and `.env.staging`
2. Fill in the required values for each environment
3. Add sensitive values to GitHub repository secrets

## Deployment Procedures

### Automatic Deployment to Staging

Every push to the master branch that modifies relevant files triggers an automatic deployment to staging:

1. Code is built and tested
2. A version tag is generated
3. The build is deployed to the staging environment
4. Verification tests are run

### Manual Deployment to Production

To deploy to production:

1. Go to Actions > Deploy Evolution Architecture
2. Click "Run workflow"
3. Select "production" from the environment dropdown
4. Click "Run workflow"
5. Monitor the workflow execution

The system will:
1. Run tests on the build
2. Deploy first to staging for verification
3. Deploy to production if staging verification succeeds
4. Generate a deployment report

## Rollback Procedures

In case of critical issues, you can roll back to a previous version:

1. Go to Actions > Rollback Deployment
2. Click "Run workflow"
3. Enter the version tag or commit hash to roll back to
4. Select the environment to roll back
5. Click "Run workflow"

The rollback process will:
1. Validate the target version
2. Build from that version
3. Deploy to the selected environment
4. Generate a rollback report

## Monitoring and Verification

After deployment, monitor the system health:

1. Check deployment reports in GitHub Actions artifacts
2. Review logs in your monitoring system
3. Verify critical features are working properly:
   - Time-series state management functionality
   - Polymorphic code generation
   - Adaptive UI components

### Health Check Endpoints

- Staging: `https://staging.cognisdigital.com/api/health`
- Production: `https://app.cognisdigital.com/api/health`

### Common Issues

| Issue | Resolution |
|-------|------------|
| Missing environment variables | Check environment setup and GitHub secrets |
| Build failures | Review workflow logs for detailed error information |
| Deployment verification failures | Check application logs and verification script output |

## Contacts

For deployment issues, contact:

- Engineering Lead: engineering@cognisdigital.com
- DevOps Team: devops@cognisdigital.com
