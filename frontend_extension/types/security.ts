// Security Types
export interface SecurityScore {
  score: number; // 0-100
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number; // > 90 days
  compromisedPasswords: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  browser: string;
  os: string;
  addedAt: number;
  lastSeen: number;
  isTrusted: boolean;
}

export interface SessionData {
  userId: string;
  deviceId: string;
  expiresAt: number;
  ephemeralKeyPair?: string;
}