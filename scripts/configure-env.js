/**
 * Environment Configuration Script for Cognis Evolution Architecture
 * 
 * This script handles environment variable configuration during deployment.
 * It merges environment-specific variables with defaults and validates required values.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Determine environment
const environment = process.env.NODE_ENV || 'development';
console.log(`Configuring environment: ${environment}`);

// Load .env files with cascading priority
const envFiles = [
  '.env.defaults',                   // Default values for all environments
  '.env',                            // Local development overrides
  `.env.${environment}`,             // Environment-specific values
  `.env.${environment}.local`        // Local overrides for specific environment (gitignored)
].filter(file => fs.existsSync(file));

// Merge environment variables
let mergedEnv = {};
for (const file of envFiles) {
  console.log(`Loading configuration from: ${file}`);
  const fileEnv = dotenv.parse(fs.readFileSync(file));
  mergedEnv = { ...mergedEnv, ...fileEnv };
}

// Required environment variables
const requiredVars = [
  'API_URL',
  'COGNIS_MODEL_ENDPOINT',
  'AUTH_DOMAIN'
];

// Validate required variables
const missingVars = requiredVars.filter(varName => !mergedEnv[varName]);
if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

// Create runtime configuration file for client-side use
const clientEnvPrefix = 'VITE_';
const clientEnv = Object.entries(mergedEnv)
  .filter(([key]) => key.startsWith(clientEnvPrefix))
  .reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

// Add version info
clientEnv.VITE_APP_VERSION = process.env.npm_package_version;
clientEnv.VITE_APP_BUILD_TIME = new Date().toISOString();
clientEnv.VITE_APP_COMMIT_HASH = process.env.COMMIT_HASH || 'development';

// Write client environment file
const clientEnvContent = `
// Generated environment configuration for ${environment}
// Generated at: ${new Date().toISOString()}
// DO NOT MODIFY DIRECTLY

window.ENV = ${JSON.stringify(clientEnv, null, 2)};
`;

fs.writeFileSync(
  path.join(process.cwd(), 'public', 'env-config.js'),
  clientEnvContent
);

console.log('Environment configuration completed successfully.');
