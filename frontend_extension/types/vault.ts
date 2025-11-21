// Vault Types
export interface PasswordEntry {
  id: string;
  domain: string;
  username: string;
  password?: string; // Only in memory, never stored
  passwordHash: string; // SHA-256 hash for breach detection
  category: string;
  notes?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
  usageCount: number;
  deviceWhitelist: string[];
}

export interface Vault {
  id: string;
  owner: string; // Sui address
  entries: PasswordEntry[];
  createdAt: number;
  updatedAt: number;
  totalEntries: number;
  isLocked: boolean;
  walrusBlobId?: string;
  encryptionSalt: string;
}

export interface VaultMetadata {
  vaultId: string;
  owner: string;
  walrusBlobId: string;
  totalEntries: number;
  createdAt: number;
  isLocked: boolean;
}

export interface EncryptedVault {
  encryptedData: string;
  iv: string;
  salt: string;
  walrusBlobId?: string;
}