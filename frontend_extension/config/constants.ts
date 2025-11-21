// Core Configuration - Hardcoded for extension build
export const SUI_NETWORK = 'testnet';
export const SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';

// Contract Package IDs (from your deployment)
export const CONTRACTS = {
  VAULT_PACKAGE_ID: '0x6d30e6996ab01fd91d80babc05d316800cff3a8c2d54d96452e6f75d4b127276',
  PASSWORD_ENTRY_PACKAGE_ID: '0xe80066a36391fd616a4f872a968a0fbe0b540637ec16ee084565c5a08d3ad4dd',
  ALERT_PACKAGE_ID: '0x1b5f1d409bbc4377fc98d2218a91419d473b737782a04f52aac084a1803bfe4f',
  ACCESS_CONTROL_PACKAGE_ID: '0x6d30e6996ab01fd91d80babc05d316800cff3a8c2d54d96452e6f75d4b127276',
};

// Walrus Configuration
export const WALRUS_CONFIG = {
  AGGREGATOR_URL: 'https://aggregator.walrus-testnet.walrus.space',
  PUBLISHER_URL: 'https://publisher.walrus-testnet.walrus.space',
  STORAGE_EPOCHS: 100, // How long to store on Walrus
};

// Extension Configuration
export const EXTENSION_CONFIG = {
  AUTO_LOCK_TIMEOUT: 15 * 60 * 1000, // 15 minutes in ms
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
};

// Security Configuration
export const SECURITY = {
  ENCRYPTION_ALGORITHM: 'AES-GCM',
  KEY_DERIVATION_ITERATIONS: 100000,
  SALT_LENGTH: 32,
  IV_LENGTH: 12,
  TAG_LENGTH: 16,
};

// Password Generator Defaults
export const PASSWORD_GENERATOR = {
  DEFAULT_LENGTH: 16,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  INCLUDE_UPPERCASE: true,
  INCLUDE_LOWERCASE: true,
  INCLUDE_NUMBERS: true,
  INCLUDE_SYMBOLS: true,
};

// API Endpoints
export const API_ENDPOINTS = {
  BACKEND_URL: 'http://localhost:3001',
  WEBSOCKET_URL: 'ws://localhost:3002',
};

// Storage Keys
export const STORAGE_KEYS = {
  ENCRYPTED_VAULT: 'pass_me_encrypted_vault',
  SESSION_TOKEN: 'pass_me_session',
  USER_PREFERENCES: 'pass_me_preferences',
  DEVICE_ID: 'pass_me_device_id',
  LAST_SYNC: 'pass_me_last_sync',
};

// Categories for password organization
export const PASSWORD_CATEGORIES = [
  'Social Media',
  'Banking',
  'Email',
  'Shopping',
  'Entertainment',
  'Work',
  'Education',
  'Other',
] as const;

export type PasswordCategory = typeof PASSWORD_CATEGORIES[number];