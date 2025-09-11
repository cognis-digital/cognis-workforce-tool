import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env' : `.env.${nodeEnv}`;
const envPath = path.resolve(__dirname, '../../', envFile);

// Load environment variables from file
dotenv.config({ path: envPath });

// Server Configuration
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const API_VERSION = process.env.API_VERSION || 'v1';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_TEST = NODE_ENV === 'test';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// Cognis API Configuration
export const COGNIS_API_KEY = process.env.COGNIS_API_KEY || '';
export const COGNIS_API_URL = process.env.COGNIS_API_URL || 'https://api.cognisdigital.com/v1';
export const COGNIS_DEFAULT_MODEL = process.env.COGNIS_DEFAULT_MODEL || 'Cognis-Zenith-4.0';

// Security Settings
export const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-replace-in-production';
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').split(',');
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

// Logging Configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Database Configuration
export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'cognis_api',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Cache Configuration
export const CACHE_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
};

// Export as a single object for convenience
export default {
  PORT,
  NODE_ENV,
  API_VERSION,
  IS_PRODUCTION,
  IS_TEST,
  IS_DEVELOPMENT,
  COGNIS_API_KEY,
  COGNIS_API_URL,
  COGNIS_DEFAULT_MODEL,
  JWT_SECRET,
  CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  LOG_LEVEL,
  DB_CONFIG,
  CACHE_CONFIG,
};
