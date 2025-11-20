export interface User {
  id: string;
  wallet_address: string;
  vault_id?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface Vault {
  id: string;
  owner: string;
  walrus_blob_id: string;
  created_at: Date;
  updated_at: Date;
  total_entries: number;
  is_locked: boolean;
}

export interface Alert {
  id: string;
  vault_id: string;
  type: 'login_attempt' | 'suspicious_activity' | 'password_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: any;
  read: boolean;
  created_at: Date;
}

export interface Activity {
  id: string;
  vault_id: string;
  entry_id?: string;
  action: string;
  device_id: string;
  ip_hash: string;
  metadata: any;
  timestamp: Date;
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  ip_address: string;
  location?: string;
  user_agent: string;
  last_seen: Date;
  is_trusted: boolean;
}