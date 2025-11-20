import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  HOST: string;

  // Sui
  SUI_NETWORK: string;
  SUI_RPC_URL: string;
  VAULT_PACKAGE_ID: string;
  ADMIN_WALLET_ADDRESS: string;
  ADMIN_PRIVATE_KEY?: string;

  // Walrus
  WALRUS_AGGREGATOR_URL: string;
  WALRUS_PUBLISHER_URL: string;
  WALRUS_EPOCHS: number;

  // WebSocket
  WS_PORT: number;

  // CORS
  CORS_ORIGIN: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE?: string;

  // Security
  JWT_SECRET: string;
  SESSION_SECRET: string;

  // Event Polling
  EVENT_POLL_INTERVAL: number;

  // Alert Thresholds
  MAX_LOGIN_ATTEMPTS: number;
  SUSPICIOUS_LOGIN_THRESHOLD: number;

  // Optional Database
  DATABASE_URL?: string;

  // Optional Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value as string;
};

const getEnvVarAsNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
};

export const config: EnvConfig = {
  // Server
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvVarAsNumber('PORT', 3001),
  HOST: getEnvVar('HOST', 'localhost'),

  // Sui
  SUI_NETWORK: getEnvVar('SUI_NETWORK', 'testnet'),
  SUI_RPC_URL: getEnvVar('SUI_RPC_URL', 'https://fullnode.testnet.sui.io:443'),
  VAULT_PACKAGE_ID: getEnvVar('VAULT_PACKAGE_ID', '0x0'),
  ADMIN_WALLET_ADDRESS: getEnvVar('ADMIN_WALLET_ADDRESS', '0x0'),
  ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,

  // Walrus
  WALRUS_AGGREGATOR_URL: getEnvVar('WALRUS_AGGREGATOR_URL', 'https://aggregator.walrus-testnet.walrus.space'),
  WALRUS_PUBLISHER_URL: getEnvVar('WALRUS_PUBLISHER_URL', 'https://publisher.walrus-testnet.walrus.space'),
  WALRUS_EPOCHS: getEnvVarAsNumber('WALRUS_EPOCHS', 5),

  // WebSocket
  WS_PORT: getEnvVarAsNumber('WS_PORT', 3002),

  // CORS
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),

  // Logging
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  LOG_FILE: process.env.LOG_FILE,

  // Security
  JWT_SECRET: getEnvVar('JWT_SECRET', 'your-secret-key-change-in-production'),
  SESSION_SECRET: getEnvVar('SESSION_SECRET', 'your-session-secret-change-in-production'),

  // Event Polling
  EVENT_POLL_INTERVAL: getEnvVarAsNumber('EVENT_POLL_INTERVAL', 5000),

  // Alert Thresholds
  MAX_LOGIN_ATTEMPTS: getEnvVarAsNumber('MAX_LOGIN_ATTEMPTS', 5),
  SUSPICIOUS_LOGIN_THRESHOLD: getEnvVarAsNumber('SUSPICIOUS_LOGIN_THRESHOLD', 3),

  // Optional
  DATABASE_URL: process.env.DATABASE_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

export default config;