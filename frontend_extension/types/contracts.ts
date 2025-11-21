// Smart Contract Types
export interface CreateVaultParams {
  walrusBlobId: string;
}

export interface UpdateVaultParams {
  vaultId: string;
  walrusBlobId: string;
}

export interface CreatePasswordEntryParams {
  vaultId: string;
  domainHash: string;
  passwordHash: string;
  deviceId: string;
}

export interface AlertEvent {
  type: 'LoginAttempt' | 'SuspiciousActivity' | 'PasswordBreach' | 'UnauthorizedAccess';
  vaultId: string;
  domain?: string;
  deviceId?: string;
  ipHash?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}