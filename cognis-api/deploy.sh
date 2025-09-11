#!/bin/bash

# Cognis API Backend Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-production}
DEPLOY_DIR="./deploy"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
PACKAGE_NAME="cognis-api-$ENVIRONMENT-$TIMESTAMP.tar.gz"

echo "=== Cognis API Backend Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"

# Ensure environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found"
  exit 1
fi

# Create build directory
echo "Creating build package..."
mkdir -p $DEPLOY_DIR

# Build the application
echo "Building application..."
npm run build

# Create deployment package
echo "Creating deployment package..."
tar -czf $DEPLOY_DIR/$PACKAGE_NAME \
  dist \
  package.json \
  package-lock.json \
  $ENV_FILE \
  Dockerfile \
  docker-compose.yml

echo "Deployment package created: $DEPLOY_DIR/$PACKAGE_NAME"

# Deploy to target environment (customize based on your infrastructure)
if [ "$ENVIRONMENT" == "production" ]; then
  echo "Deploying to production environment..."
  # Add production deployment commands here
  # Example: scp $DEPLOY_DIR/$PACKAGE_NAME user@production-server:/deployment/
  # Example: ssh user@production-server "cd /deployment && tar -xzf $PACKAGE_NAME && docker-compose up -d"
elif [ "$ENVIRONMENT" == "staging" ]; then
  echo "Deploying to staging environment..."
  # Add staging deployment commands here
else
  echo "Package created but not deployed. Use:"
  echo "  scp $DEPLOY_DIR/$PACKAGE_NAME user@your-server:/deployment/"
  echo "  ssh user@your-server \"cd /deployment && tar -xzf $PACKAGE_NAME && docker-compose up -d\""
fi

echo "Deployment complete!"
