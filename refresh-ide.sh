#!/bin/bash

# Script to refresh IDE references and clear stale errors
# This forces the IDE to reindex and clear cached errors

echo "Refreshing IDE file references..."

# Create list of directories to refresh
DIRS_TO_REFRESH=(
  ".github/workflows"
  "contracts"
  "cognis-api/src"
  "src/components/blockchain"
  "src/config"
  "src/services"
)

# Touch all files in the directories to update timestamps
for dir in "${DIRS_TO_REFRESH[@]}"; do
  if [ -d "$dir" ]; then
    echo "Refreshing files in $dir"
    find "$dir" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.yml" -o -name "*.sol" -o -name "*.js" | xargs touch
  fi
done

# Update main config files
touch .env.development .env.production package.json tsconfig.json hardhat.config.js hardhat.config.cjs

# Delete any temporary files that might cause issues
rm -f .github/workflows/*-final.yml .github/workflows/*-fixed.yml

echo "Refresh complete. Please restart your IDE if errors persist."
