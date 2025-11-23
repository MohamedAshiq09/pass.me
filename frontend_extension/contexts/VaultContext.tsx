'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { PasswordEntry, VaultData } from '@/lib/api/client';
import { hash } from '@/lib/crypto/encryption';
import { apiClient } from '@/lib/api/client';
import { uploadToWalrus, downloadFromWalrus } from '@/lib/walrus/client';
import { useAuth } from './AuthContext';

interface Vault {
  id: string;
  owner: string;
  entries: PasswordEntry[];
  createdAt: number;
  updatedAt: number;
  totalEntries: number;
  isLocked: boolean;
  walrusBlobId?: string;
}

interface VaultContextType {
  vault: Vault | null;
  entries: PasswordEntry[];
  isLoading: boolean;
  error: string | null;

  // Core operations
  createVault: () => Promise<void>;
  loadVault: (vaultId: string) => Promise<void>;
  lockVault: () => Promise<void>;

  // Entry management
  addEntry: (entryData: Omit<PasswordEntry, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'deviceWhitelist'>) => Promise<PasswordEntry>;
  updateEntry: (entryId: string, updates: Partial<PasswordEntry>) => Promise<PasswordEntry>;
  deleteEntry: (entryId: string) => Promise<void>;
  getEntry: (entryId: string) => PasswordEntry | undefined;

  // Search and filter
  searchEntries: (query: string) => PasswordEntry[];
  getEntriesByCategory: (category: string) => PasswordEntry[];
  getFavoriteEntries: () => PasswordEntry[];
  getEntriesForDomain: (domain: string) => PasswordEntry[];

  // Usage tracking
  recordUsage: (entryId: string) => Promise<void>;

  // Vault info
  getVaultInfo: () => { totalEntries: number; lastUpdated: number; isLocked: boolean } | null;

  // Sync
  syncVault: () => Promise<void>;
}

export const VaultContext = createContext<VaultContextType | undefined>(undefined);

const MASTER_PASSWORD = 'demo-password-123'; // In production, this should be user's actual password

// Helper to get user-specific storage key
const getStorageKey = (address: string | null) => {
  if (!address) return 'pass_me_vault_guest';
  // Use first 16 chars of address for key (enough to be unique)
  return `pass_me_vault_${address.slice(0, 18)}`;
};

// Helper to get blob ID storage key
const getBlobIdKey = (address: string | null) => {
  if (!address) return 'pass_me_blobid_guest';
  return `pass_me_blobid_${address.slice(0, 18)}`;
};

export function VaultProvider({ children }: { children: ReactNode }) {
  const { address, isAuthenticated } = useAuth();
  const [vault, setVault] = useState<Vault | null>(null);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);

  // Re-initialize vault when user changes
  useEffect(() => {
    if (address !== currentUserAddress) {
      console.log('👤 User changed:', { from: currentUserAddress, to: address });
      setCurrentUserAddress(address);
      initializeVault(address);
    }
  }, [address, currentUserAddress]);

  // ✅ CRITICAL FIX: Enhanced saveToLocalStorage with verification
  const saveToLocalStorage = (updatedVault: Vault, userAddress: string | null = currentUserAddress) => {
    try {
      const storageKey = getStorageKey(userAddress);
      const dataToStore = {
        vault: updatedVault,
        timestamp: Date.now(),
        owner: userAddress, // Store owner address for verification
      };

      const jsonStr = JSON.stringify(dataToStore);

      console.log('💾 Saving to localStorage:', {
        key: storageKey,
        owner: userAddress?.slice(0, 10) + '...',
        entriesCount: updatedVault.entries.length,
        dataSize: jsonStr.length,
        entryIds: updatedVault.entries.map(e => e.id),
        entryDomains: updatedVault.entries.map(e => e.domain)
      });

      localStorage.setItem(storageKey, jsonStr);

      // ✅ VERIFY save worked immediately
      const verification = localStorage.getItem(storageKey);
      if (!verification) {
        console.error('⚠️ CRITICAL: localStorage.setItem succeeded but data not found on read!');
        throw new Error('localStorage verification failed');
      } else {
        try {
          const verifyParsed = JSON.parse(verification);
          const savedCount = verifyParsed.vault?.entries?.length || 0;
          console.log('✅ Save verified:', savedCount, 'entries in localStorage');

          if (savedCount !== updatedVault.entries.length) {
            console.error('⚠️ WARNING: Mismatch in entry count!', {
              expected: updatedVault.entries.length,
              actual: savedCount
            });
          }
        } catch (parseErr) {
          console.error('⚠️ WARNING: Saved data cannot be parsed!', parseErr);
        }
      }
    } catch (err) {
      console.error('❌ Failed to save to localStorage:', err);

      // Try alternative storage if localStorage is full
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        console.error('💾 localStorage quota exceeded! Size:', JSON.stringify(updatedVault).length);
        // Could implement cleanup here
        alert('Storage quota exceeded. Please delete some passwords.');
      }

      throw err; // Re-throw so caller knows save failed
    }
  };

  const createEmptyVault = (userAddress: string | null) => {
    console.log('🆕 Creating empty vault for user:', userAddress?.slice(0, 10) + '...');
    const emptyVault: Vault = {
      id: 'vault-' + Date.now(),
      owner: userAddress || '0x' + Math.random().toString(16).substr(2, 40),
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalEntries: 0,
      isLocked: false,
    };
    setVault(emptyVault);
    setEntries([]);
    saveToLocalStorage(emptyVault, userAddress);
    console.log('✅ Empty vault created and saved for user');
  };

  // 🔄 Restore vault from Walrus (for cross-device sync)
  const restoreFromWalrus = async (userAddress: string): Promise<boolean> => {
    try {
      console.log('🔍 Checking for existing vault on Walrus for:', userAddress.slice(0, 10) + '...');

      // First check if we have a cached blobId
      const blobIdKey = getBlobIdKey(userAddress);
      let blobId = localStorage.getItem(blobIdKey);

      // If no cached blobId, try to get it from the backend/blockchain
      if (!blobId) {
        console.log('📡 Querying backend for vault info...');
        try {
          const response = await apiClient.getVaultsByOwner(userAddress);
          if (response.success && response.data && response.data.length > 0) {
            // Get the most recent vault
            const vaultInfo = response.data[0];
            blobId = vaultInfo.walrus_blob_id || vaultInfo.walrusBlobId;
            console.log('📦 Found vault on blockchain, blobId:', blobId);
          }
        } catch (err) {
          console.log('⚠️ Could not query backend (might be offline):', err);
        }
      }

      if (!blobId) {
        console.log('ℹ️ No existing vault found on Walrus for this user');
        return false;
      }

      console.log('📥 Downloading vault from Walrus, blobId:', blobId);
      const vaultData: VaultData = await downloadFromWalrus(blobId, MASTER_PASSWORD);

      if (vaultData && vaultData.entries && vaultData.entries.length > 0) {
        console.log('✅ Downloaded vault with', vaultData.entries.length, 'entries');

        // Create vault object from downloaded data
        const restoredVault: Vault = {
          id: 'vault-restored-' + Date.now(),
          owner: userAddress,
          entries: vaultData.entries,
          createdAt: vaultData.metadata?.lastModified || Date.now(),
          updatedAt: Date.now(),
          totalEntries: vaultData.entries.length,
          isLocked: false,
          walrusBlobId: blobId,
        };

        // Save to local storage
        setVault(restoredVault);
        setEntries(vaultData.entries);
        saveToLocalStorage(restoredVault, userAddress);

        // Cache the blobId for future use
        localStorage.setItem(blobIdKey, blobId);

        console.log('🎉 Vault restored from Walrus successfully!');
        return true;
      } else {
        console.log('⚠️ Downloaded vault is empty');
        return false;
      }
    } catch (err) {
      console.error('❌ Failed to restore from Walrus:', err);
      return false;
    }
  };

  // ✅ CRITICAL FIX: Enhanced initializeVault with better logging
  const initializeVault = async (userAddress: string | null) => {
    try {
      setIsLoading(true);
      setError(null);

      const storageKey = getStorageKey(userAddress);
      console.log('🔍 Initializing vault for user:', userAddress?.slice(0, 10) + '...');
      console.log('📦 Storage key:', storageKey);

      const storedData = localStorage.getItem(storageKey);
      console.log('📦 localStorage raw data:', storedData ? `Found (${storedData.length} chars)` : 'Empty');

      if (storedData) {
        try {
          console.log('🔓 Parsing vault data...');
          const parsed = JSON.parse(storedData);
          console.log('📋 Parsed structure:', {
            hasVault: !!parsed.vault,
            hasEntries: !!parsed.vault?.entries,
            isArray: Array.isArray(parsed.vault?.entries),
            entriesCount: parsed.vault?.entries?.length || 0,
            timestamp: parsed.timestamp
          });

          if (parsed.vault && Array.isArray(parsed.vault.entries)) {
            console.log('✅ Valid vault structure with', parsed.vault.entries.length, 'entries');
            console.log('📋 Entry details:', parsed.vault.entries.map((e: PasswordEntry) => ({
              id: e.id,
              domain: e.domain,
              username: e.username,
              createdAt: new Date(e.createdAt).toISOString()
            })));

            // ✅ CRITICAL: Set BOTH vault and entries atomically
            const vaultData = parsed.vault;
            setVault(vaultData);
            setEntries(vaultData.entries);

            // Verify state was set
            setTimeout(() => {
              console.log('🔄 Post-load state check:', {
                vaultId: vaultData.id,
                entriesInState: vaultData.entries.length,
                firstEntry: vaultData.entries[0]?.domain
              });
            }, 100);
          } else {
            console.warn('⚠️ Invalid vault structure in localStorage:', {
              hasVault: !!parsed.vault,
              vaultType: typeof parsed.vault,
              hasEntries: !!parsed.vault?.entries,
              entriesType: typeof parsed.vault?.entries,
              isArray: Array.isArray(parsed.vault?.entries)
            });
            console.warn('📄 Full parsed data:', parsed);
            createEmptyVault(userAddress);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse vault data:', parseError);
          console.error('📄 Raw data that failed:', storedData.substring(0, 200) + '...');
          createEmptyVault(userAddress);
        }
      } else {
        console.log('ℹ️ No vault in localStorage for user');

        // 🔄 Try to restore from Walrus (cross-device sync!)
        if (userAddress) {
          console.log('🔄 Attempting to restore from Walrus...');
          const restored = await restoreFromWalrus(userAddress);
          if (restored) {
            console.log('🎉 Vault restored from Walrus - cross-device sync successful!');
            return; // Vault loaded from Walrus, no need to create empty
          }
        }

        console.log('🆕 Creating new empty vault for user');
        createEmptyVault(userAddress);
      }
    } catch (err) {
      console.error('❌ Failed to initialize vault:', err);
      setError('Failed to initialize vault');
      createEmptyVault(userAddress);
    } finally {
      setIsLoading(false);
      console.log('✅ Vault initialization complete');
    }
  };

  const createVault = async () => {
    try {
      setIsLoading(true);
      setError(null);
      createEmptyVault(currentUserAddress);
    } catch (err) {
      console.error('Error creating vault:', err);
      setError('Failed to create vault');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadVault = async (vaultId: string) => {
    // Already loaded in initializeVault
    return;
  };

  const lockVault = async () => {
    try {
      // Don't delete vault data - just clear from memory
      // User's vault data stays in localStorage for when they log back in
      console.log('🔒 Locking vault (keeping data in localStorage for user:', currentUserAddress?.slice(0, 10) + '...)');
      setVault(null);
      setEntries([]);
      // Note: We do NOT remove from localStorage - each user has their own key
    } catch (err) {
      console.error('Error locking vault:', err);
      setError('Failed to lock vault');
      throw err;
    }
  };

  const syncVault = async () => {
    try {
      console.log('🔄 Syncing vault to Walrus and Sui...');

      // ✅ CRITICAL FIX: Get fresh vault data from localStorage (source of truth)
      const storageKey = getStorageKey(currentUserAddress);
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) {
        console.log('⚠️ No vault in localStorage to sync');
        return;
      }

      let currentVault: Vault;
      try {
        const parsed = JSON.parse(storedData);
        currentVault = parsed.vault;

        if (!currentVault || !Array.isArray(currentVault.entries)) {
          console.error('⚠️ Invalid vault structure in localStorage');
          return;
        }

        console.log('📦 Syncing vault with', currentVault.entries.length, 'entries');
        console.log('📋 Entries to sync:', currentVault.entries.map(e => ({ id: e.id, domain: e.domain })));
      } catch (parseErr) {
        console.error('❌ Failed to parse vault from localStorage:', parseErr);
        return;
      }

      // Prepare vault data for upload using FRESH data
      const vaultData = {
        entries: currentVault.entries,  // ✅ Use fresh entries from localStorage!
        metadata: {
          version: '1.0.0',
          lastModified: Date.now(),
        },
      };

      console.log('📤 Uploading', vaultData.entries.length, 'entries to Walrus');

      // Upload to Walrus
      const blobId = await uploadToWalrus(vaultData, MASTER_PASSWORD);
      console.log('✅ Uploaded to Walrus, blob ID:', blobId);

      // Create or update vault on Sui via backend
      const response = await apiClient.createVault(blobId);

      if (response.success) {
        console.log('✅ Vault synced to blockchain');

        // ✅ CRITICAL: Update vault with blob ID WITHOUT changing entries
        const updatedVault = {
          ...currentVault,  // ✅ Use fresh vault state from localStorage!
          walrusBlobId: blobId,
          updatedAt: Date.now(),
        };

        console.log('💾 Saving synced vault with', updatedVault.entries.length, 'entries');

        // Update React state
        setVault(updatedVault);
        setEntries(updatedVault.entries);  // ✅ Also update entries state!

        // Save to localStorage
        saveToLocalStorage(updatedVault);

        // 🔄 Save blobId for cross-device sync
        if (currentUserAddress) {
          const blobIdKey = getBlobIdKey(currentUserAddress);
          localStorage.setItem(blobIdKey, blobId);
          console.log('💾 Saved blobId for cross-device sync:', blobId.slice(0, 20) + '...');
        }

        console.log('✅ Sync complete -', updatedVault.entries.length, 'entries preserved');
      } else {
        console.error('Failed to sync to blockchain:', response.error);
        throw new Error(response.error || 'Blockchain sync failed');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to sync vault');
      throw err;
    }
  };

  const addEntry = async (entryData: Omit<PasswordEntry, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'deviceWhitelist'>) => {
    try {
      if (!vault) throw new Error('No vault loaded');

      console.log('➕ Adding password entry:', {
        domain: entryData.domain,
        username: entryData.username
      });

      const newEntry: PasswordEntry = {
        ...entryData,
        id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        passwordHash: await hash(entryData.username + entryData.domain),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        deviceWhitelist: ['device1'],
      };

      console.log('🆔 New entry ID:', newEntry.id);

      const updatedEntries = [...vault.entries, newEntry];
      const updatedVault = {
        ...vault,
        entries: updatedEntries,
        totalEntries: updatedEntries.length,
        updatedAt: Date.now(),
      };

      console.log('📊 Vault updated:', {
        totalEntries: updatedVault.totalEntries,
        newEntryCount: updatedEntries.length
      });

      // ✅ CRITICAL: Update state AND localStorage BEFORE syncing
      setVault(updatedVault);
      setEntries(updatedEntries);
      saveToLocalStorage(updatedVault);

      console.log('✅ Password entry added and saved successfully!');
      console.log('⏳ Waiting for localStorage to flush...');

      // ✅ CRITICAL FIX: Wait for state to settle before syncing
      // This ensures localStorage has the latest data before sync reads it
      await new Promise(resolve => setTimeout(resolve, 100));

      // Sync to Walrus and Sui in background
      syncVault().catch(err => {
        console.error('⚠️ Background sync failed (entry still saved locally):', err);
        // Don't throw - entry is saved locally
      });

      return newEntry;
    } catch (err) {
      console.error('Error adding entry:', err);
      setError('Failed to add password entry');
      throw err;
    }
  };

  const updateEntry = async (entryId: string, updates: Partial<PasswordEntry>) => {
    try {
      if (!vault) throw new Error('No vault loaded');

      const updatedEntries = vault.entries.map(e =>
        e.id === entryId ? { ...e, ...updates, updatedAt: Date.now() } : e
      );

      const updatedVault = {
        ...vault,
        entries: updatedEntries,
        updatedAt: Date.now(),
      };

      setVault(updatedVault);
      setEntries(updatedEntries);
      saveToLocalStorage(updatedVault);

      // Sync in background
      syncVault().catch(err => console.error('Background sync failed:', err));

      const updatedEntry = updatedEntries.find(e => e.id === entryId);
      if (!updatedEntry) throw new Error('Entry not found');

      return updatedEntry;
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update password entry');
      throw err;
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      if (!vault) throw new Error('No vault loaded');

      const updatedEntries = vault.entries.filter(e => e.id !== entryId);

      const updatedVault = {
        ...vault,
        entries: updatedEntries,
        totalEntries: updatedEntries.length,
        updatedAt: Date.now(),
      };

      setVault(updatedVault);
      setEntries(updatedEntries);
      saveToLocalStorage(updatedVault);

      // Sync in background
      syncVault().catch(err => console.error('Background sync failed:', err));
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete password entry');
      throw err;
    }
  };

  const getEntry = (entryId: string) => {
    return entries.find(entry => entry.id === entryId);
  };

  const searchEntries = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.domain.toLowerCase().includes(lowerQuery) ||
      entry.username.toLowerCase().includes(lowerQuery)
    );
  };

  const getEntriesByCategory = (category: string) => {
    return entries.filter(entry => entry.category === category);
  };

  const getFavoriteEntries = () => {
    return entries.filter(entry => entry.favorite);
  };

  const getEntriesForDomain = (domain: string) => {
    // Normalize domain (remove www., protocol, trailing slash)
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '');

    return entries.filter(entry => {
      const normalizedEntryDomain = entry.domain
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .replace(/\/$/, '');

      return normalizedEntryDomain === normalizedDomain ||
        normalizedEntryDomain.includes(normalizedDomain) ||
        normalizedDomain.includes(normalizedEntryDomain);
    });
  };

  const recordUsage = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;

      await updateEntry(entryId, {
        lastUsed: Date.now(),
        usageCount: entry.usageCount + 1,
      });
    } catch (err) {
      console.error('Error recording usage:', err);
    }
  };

  const getVaultInfo = () => {
    if (!vault) return null;
    return {
      totalEntries: vault.totalEntries,
      lastUpdated: vault.updatedAt,
      isLocked: vault.isLocked,
    };
  };

  const value: VaultContextType = {
    vault,
    entries,
    isLoading,
    error,
    createVault,
    loadVault,
    lockVault,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    searchEntries,
    getEntriesByCategory,
    getFavoriteEntries,
    getEntriesForDomain,
    recordUsage,
    getVaultInfo,
    syncVault,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}