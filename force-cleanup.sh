#!/bin/bash

# Force cleanup of all problematic workflow files and IDE cache
# This script will completely remove problematic files and any references to them

echo "Starting aggressive cleanup of problematic files..."

# Remove problematic workflow files if they still exist
rm -f .github/workflows/blockchain-integration-final.yml
rm -f .github/workflows/blockchain-integration-fixed.yml

# Create empty placeholder files to reset error tracking
touch .github/workflows/blockchain-integration.yml

# Clean temporary IDE files that might contain references
find . -name "*.iml" -delete
find . -name ".DS_Store" -delete
find . -name ".idea" -type d -exec rm -rf {} +
find . -name "node_modules/.cache" -type d -exec rm -rf {} +
find . -name ".vscode/.cache" -type d -exec rm -rf {} +

# Recreate directories if needed
mkdir -p .github/workflows

# Touch all workflow files to update timestamps
find .github/workflows -type f -name "*.yml" | xargs touch

echo "Cleanup complete. Please restart your IDE completely to clear all cached errors."
