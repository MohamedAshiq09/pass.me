/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SessionManager - Handles zkLogin session persistence with 24h TTL
 * Stores session data, proofs, and JWT tokens for reuse across transactions
 */

export interface CachedProofData {
  zkProof: any;
  jwtToken: string;
  address: string;
  userSalt: string;
  maxEpoch: number;
  randomness: string;
  ephemeralPrivateKey: string;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
}

export interface SessionData {
  ephemeralPrivateKey: string;
  randomness: string;
  maxEpoch: string;
  userSalt: string;
  nonce?: string;
}

const SESSION_KEY = "zkLoginSession";
const PROOF_CACHE_KEY = "zkLoginProofCache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class SessionManager {
  /**
   * Check if a cached proof is still valid (not expired)
   */
  static isCacheValid(): boolean {
    if (typeof window === "undefined") return false;

    const cached = localStorage.getItem(PROOF_CACHE_KEY);
    if (!cached) return false;

    try {
      const data: CachedProofData = JSON.parse(cached);
      const now = Date.now();
      return now < data.expiresAt;
    } catch {
      return false;
    }
  }

  /**
   * Get cached proof data if valid
   * NOTE: Returns partial data (address only) - sensitive fields are in React context
   */
  static getCachedProof(): Partial<CachedProofData> | null {
    if (typeof window === "undefined") return null;

    if (!this.isCacheValid()) {
      this.clearProofCache();
      return null;
    }

    const cached = localStorage.getItem(PROOF_CACHE_KEY);
    if (!cached) return null;

    try {
      const data = JSON.parse(cached);
      // Return what we have (address and proof) - context has the rest
      return data as Partial<CachedProofData>;
    } catch {
      this.clearProofCache();
      return null;
    }
  }

  /**
   * Save proof data to cache with 24h TTL
   * NOTE: Stores zkProof data including jwtToken, userSalt for transaction signing
   * This data is required to create zkLogin signatures for transactions
   */
  static cacheProof(data: Omit<CachedProofData, "createdAt" | "expiresAt">): void {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const cacheData = {
      ...data,
      createdAt: now,
      expiresAt: now + CACHE_TTL,
    };

    localStorage.setItem(PROOF_CACHE_KEY, JSON.stringify(cacheData));
    console.log("✅ zkLogin proof cached (valid for 24h) - includes proof data for transactions");
  }

  /**
   * Clear cached proof
   */
  static clearProofCache(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PROOF_CACHE_KEY);
    console.log("🗑️ Proof cache cleared");
  }

  /**
   * Get remaining cache TTL in milliseconds
   */
  static getCacheTTL(): number {
    const cached = this.getCachedProof();
    if (!cached || !cached.expiresAt) return 0;

    const remaining = cached.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Format remaining cache time for display
   */
  static getFormattedTTL(): string {
    const ttl = this.getCacheTTL();
    if (ttl <= 0) return "Expired";

    const hours = Math.floor(ttl / (60 * 60 * 1000));
    const minutes = Math.floor((ttl % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }

  /**
   * Save session data
   */
  static saveSession(session: SessionData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Load session data
   */
  static loadSession(): SessionData | null {
    if (typeof window === "undefined") return null;

    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    try {
      return JSON.parse(sessionStr) as SessionData;
    } catch {
      return null;
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
    this.clearProofCache();
    console.log("🗑️ Session and proof cache cleared");
  }

  /**
   * Check if user is authenticated (has valid cached proof)
   */
  static isAuthenticated(): boolean {
    return this.isCacheValid();
  }

  /**
   * Get user's cached address
   */
  static getCachedAddress(): string | null {
    const cached = this.getCachedProof();
    return cached?.address || null;
  }
}
