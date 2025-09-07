# Cognis Workforce Tool - Error Fix Deployment

This document provides instructions for deploying the fixed version of Cognis Workforce Tool that resolves the following issues:

1. `Crown is not defined` error in Header.tsx
2. `crypto.randomUUID is not a function` errors
3. `runtime.lastError` message channel errors

## Deployment Package

The deployment package is located at:
`/Users/admin/Downloads/Cognis Workforce Tool/cognis-workforce-fixed.tar.gz`

## Deployment Instructions

### 1. Transfer the Deployment Package to the Production Server

```bash
scp cognis-workforce-fixed.tar.gz user@cognisdigitalworkforce.pro:/tmp/
```

### 2. On the Production Server

Connect to the server via SSH:

```bash
ssh user@cognisdigitalworkforce.pro
```

Navigate to the appropriate directory and extract the files:

```bash
cd /tmp
tar -xzf cognis-workforce-fixed.tar.gz
```

Back up the current production files:

```bash
sudo mv /var/www/html/cognis-workforce /var/www/html/cognis-workforce-backup-$(date +%Y%m%d)
```

Deploy the fixed files:

```bash
sudo mv dist /var/www/html/cognis-workforce
sudo chown -R www-data:www-data /var/www/html/cognis-workforce
sudo chmod -R 755 /var/www/html/cognis-workforce
```

### 3. Verify the Deployment

After deployment, verify that the following issues are fixed:

1. Open the website in a browser
2. Open the browser developer console (F12 or right-click → Inspect)
3. Confirm that the following errors are no longer present:
   - No more "Crown is not defined" errors
   - No more "crypto.randomUUID is not a function" errors
   - No more "runtime.lastError" or "message channel closed" errors

## Rollback Instructions (If Needed)

If you encounter any issues with the new deployment, you can roll back using the backup:

```bash
sudo rm -rf /var/www/html/cognis-workforce
sudo mv /var/www/html/cognis-workforce-backup-YYYYMMDD /var/www/html/cognis-workforce
sudo chown -R www-data:www-data /var/www/html/cognis-workforce
sudo chmod -R 755 /var/www/html/cognis-workforce
```

## Fix Details

### 1. Crown Import Fix

Added missing import in Header.tsx:
```typescript
import { Menu, Bell, User, Crown } from 'lucide-react';
```

### 2. crypto.randomUUID Polyfill

Created a polyfill for browsers that don't support crypto.randomUUID:
```javascript
if (typeof window !== 'undefined' && window.crypto) {
  if (typeof window.crypto.randomUUID !== 'function') {
    window.crypto.randomUUID = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }
}
```

### 3. Runtime Error Handling

Added event listeners to handle runtime.lastError messages:
```javascript
window.addEventListener('error', function(event) {
  if (event && event.error && event.error.message && 
      (event.error.message.includes('message channel closed') || 
        event.error.message.includes('runtime.lastError'))) {
    event.preventDefault();
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', function(event) {
  if (event && event.reason && event.reason.message && 
      (event.reason.message.includes('message channel closed') || 
        event.reason.message.includes('runtime.lastError'))) {
    event.preventDefault();
    return true;
  }
});
```
