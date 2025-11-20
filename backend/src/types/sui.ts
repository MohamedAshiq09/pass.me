export interface VaultObject {
  id: string;
  owner: string;
  walrus_blob_id: string;
  created_at: number;
  updated_at: number;
  total_entries: number;
  is_locked: boolean;
  zklogin_enabled: boolean;
}

export interface PasswordEntryObject {
  id: string;
  vault_id: string;
  domain_hash: string;
  password_hash: string;
  device_whitelist: string[];
  created_at: number;
  last_used: number;
  usage_count: number;
}

export interface LoginAttemptEvent {
  vault_id: string;
  domain_hash: string;
  device_id: string;
  ip_hash: string;
  timestamp: number;
  success: boolean;
}

export interface SuspiciousActivityEvent {
  vault_id: string;
  entry_id: string;
  domain_hash: string;
  device_id: string;
  reason: string;
  timestamp: number;
  severity: number;
}

export interface PasswordBreachEvent {
  vault_id: string;
  entry_id: string;
  domain_hash: string;
  timestamp: number;
}

export interface UnauthorizedAccessEvent {
  vault_id: string;
  device_id: string;
  ip_hash: string;
  timestamp: number;
}

export type SuiEvent = 
  | LoginAttemptEvent 
  | SuspiciousActivityEvent 
  | PasswordBreachEvent 
  | UnauthorizedAccessEvent;

export interface SuiEventWrapper {
  id: {
    txDigest: string;
    eventSeq: string;
  };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson: any;
  bcs: string;
  timestampMs: string;
}