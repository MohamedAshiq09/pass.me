/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SessionManager - Handles zkLogin session persistence with 24h TTL
 * Uses chrome.storage for extension, localStorage for web
 */

import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  isExtensionContext,
} from './extension-storage';

export interface CachedProofData {
  zkProof: any;
  jwtToken: string;
  address: string;
  userSalt: string;
  maxEpoch: number;
  randomness: string;
  ephemeralPrivateKey: string;
  createdAt: number;
  expiresAt: number;
}

export interface SessionData {
  ephemeralPrivateKey: string;
  ephemeralPublicKey?: string;
  randomness: string;
  maxEpoch: string;
  userSalt: string;
  nonce?: string;
}

const SESSION_KEY = "zkLoginSession";
const PROOF_CACHE_KEY = "zkLoginProofCache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// In-memory cache for sync access (populated from async storage)
let cachedProofData: CachedProofData | null = null;
let isInitialized = false;

export class SessionManager {
  /**
   * Initialize the session manager (load from storage)
   * Call this on app startup
   */
  static async initialize(): Promise<void> {
    if (isInitialized) return;

    try {
      const cached = await getStorageItem<CachedProofData>(PROOF_CACHE_KEY);
      if (cached && cached.expiresAt > Date.now()) {
        cachedProofData = cached;
        console.log('✅ Session loaded from storage');
      } else if (cached) {
        // Expired, clear it
        await removeStorageItem(PROOF_CACHE_KEY);
        cachedProofData = null;
        console.log('🗑️ Expired session cleared');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
    isInitialized = true;
  }

  /**
   * Check if a cached proof is still valid (not expired)
   */
  static isCacheValid(): boolean {
    if (!cachedProofData) return false;
    return Date.now() < cachedProofData.expiresAt;
  }

  /**
   * Check if a cached proof is still valid (async version)
   */
  static async isCacheValidAsync(): Promise<boolean> {
    await this.initialize();
    return this.isCacheValid();
  }

  /**
   * Get cached proof data if valid
   */
  static getCachedProof(): Partial<CachedProofData> | null {
    if (!this.isCacheValid()) {
      return null;
    }
    return cachedProofData;
  }

  /**
   * Get cached proof data (async version)
   */
  static async getCachedProofAsync(): Promise<Partial<CachedProofData> | null> {
    await this.initialize();
    return this.getCachedProof();
  }

  /**
   * Save proof data to cache with 24h TTL
   */
  static async cacheProof(data: Omit<CachedProofData, "createdAt" | "expiresAt">): Promise<void> {
    const now = Date.now();
    const cacheData: CachedProofData = {
      ...data,
      createdAt: now,
      expiresAt: now + CACHE_TTL,
    };

    // Update in-memory cache
    cachedProofData = cacheData;
    isInitialized = true;

    // Persist to storage
    await setStorageItem(PROOF_CACHE_KEY, cacheData);
    console.log("✅ zkLogin proof cached (valid for 24h)");
  }

  /**
   * Clear cached proof
   */
  static async clearProofCache(): Promise<void> {
    cachedProofData = null;
    await removeStorageItem(PROOF_CACHE_KEY);
    console.log("🗑️ Proof cache cleared");
  }

  /**
   * Get remaining cache TTL in milliseconds
   */
  static getCacheTTL(): number {
    if (!cachedProofData || !cachedProofData.expiresAt) return 0;
    const remaining = cachedProofData.expiresAt - Date.now();
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
  static async saveSession(session: SessionData): Promise<void> {
    await setStorageItem(SESSION_KEY, session);
  }

  /**
   * Load session data
   */
  static async loadSession(): Promise<SessionData | null> {
    return await getStorageItem<SessionData>(SESSION_KEY);
  }

  /**
   * Clear session data
   */
  static async clearSession(): Promise<void> {
    cachedProofData = null;
    isInitialized = false;
    await removeStorageItem(SESSION_KEY);
    await removeStorageItem(PROOF_CACHE_KEY);
    console.log("🗑️ Session and proof cache cleared");
  }

  /**
   * Check if user is authenticated (has valid cached proof)
   */
  static isAuthenticated(): boolean {
    return this.isCacheValid();
  }

  /**
   * Check if user is authenticated (async version)
   */
  static async isAuthenticatedAsync(): Promise<boolean> {
    await this.initialize();
    return this.isAuthenticated();
  }

  /**
   * Get user's cached address
   */
  static getCachedAddress(): string | null {
    const cached = this.getCachedProof();
    return cached?.address || null;
  }

  /**
   * Get user's cached address (async version)
   */
  static async getCachedAddressAsync(): Promise<string | null> {
    await this.initialize();
    return this.getCachedAddress();
  }
}
