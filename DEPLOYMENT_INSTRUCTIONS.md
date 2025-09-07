# Production Deployment Instructions

This document provides instructions for deploying the fixed version of Cognis Workforce Tool to production.

## What's Fixed

The following issues have been fixed in this build:

1. Fixed "Crown is not defined" error in Header.tsx by adding the missing import
2. Added crypto.randomUUID polyfill for browsers that don't support it natively
3. Replaced OpenAI references with $CGNS in API messages
4. Added error handling for runtime.lastError issues related to message channels

## Deployment Package

The production deployment package is located at:
`/Users/admin/Downloads/Cognis Workforce Tool/cognis-workforce-production.tar.gz`

This archive contains the full build output with all fixes implemented.

## Deployment Steps

### 1. Transfer the Package to Production Server

```bash
scp cognis-workforce-production.tar.gz user@production-server:/tmp/
```

### 2. Extract and Deploy on Production Server

SSH into the production server and run:

```bash
# Connect to server
ssh user@production-server

# Navigate to temporary directory
cd /tmp

# Extract package
tar -xzvf cognis-workforce-production.tar.gz

# Backup current deployment
mv /var/www/html/cognis-workforce /var/www/html/cognis-workforce-backup-$(date +%Y%m%d)

# Deploy new version
mv dist /var/www/html/cognis-workforce

# Set proper permissions
chown -R www-data:www-data /var/www/html/cognis-workforce
chmod -R 755 /var/www/html/cognis-workforce
```

### 3. Verify Deployment

1. Open the production site in a browser
2. Check the browser console for errors:
   - Confirm "Crown is not defined" error is gone
   - Confirm no crypto.randomUUID errors appear
   - Verify no OpenAI API key warnings (replaced with $CGNS)
   - Check that runtime.lastError messages are handled

### 4. Rollback Procedure (If Needed)

If issues are encountered:

```bash
# Remove problematic deployment
rm -rf /var/www/html/cognis-workforce

# Restore from backup
mv /var/www/html/cognis-workforce-backup-YYYYMMDD /var/www/html/cognis-workforce

# Reset permissions
chown -R www-data:www-data /var/www/html/cognis-workforce
chmod -R 755 /var/www/html/cognis-workforce
```

## Contact Information

If you encounter any issues during deployment, please contact:
- Development Team: dev@cognisdigital.com
- DevOps Support: devops@cognisdigital.com
