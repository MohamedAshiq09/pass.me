'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { PasswordEntry } from '@/lib/api/client';
import { hash } from '@/lib/crypto/encryption';

interface Vault {
  id: string;
  owner: string;
  entries: PasswordEntry[];
  createdAt: number;
  updatedAt: number;
  totalEntries: number;
  isLocked: boolean;
}

interface VaultContextType {
  vault: Vault | null;
  entries: PasswordEntry[];
  isLoading: boolean;
  error: string | null;
  searchEntries: (query: string) => PasswordEntry[];
  getEntriesByCategory: (category: string) => PasswordEntry[];
  getFavoriteEntries: () => PasswordEntry[];

  // Usage tracking
  recordUsage: (entryId: string) => Promise<void>;

  // Vault info
  getVaultInfo: () => { totalEntries: number; lastUpdated: number; isLocked: boolean } | null;
}

export const VaultContext = createContext<VaultContextType | undefined>(undefined);

const STORAGE_KEY = 'pass_me_vault_data';

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize vault on mount
  useEffect(() => {
    initializeVault();
  }, []);

  const saveToLocalStorage = (updatedVault: Vault) => {
    try {
      const dataToStore = {
        vault: updatedVault,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      console.log('✅ Vault saved to localStorage:', updatedVault.entries.length, 'entries');
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  const createEmptyVault = () => {
    const emptyVault: Vault = {
      id: 'vault-' + Date.now(),
      owner: '0x' + Math.random().toString(16).substr(2, 40),
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalEntries: 0,
      isLocked: false,
    };
    setVault(emptyVault);
    setEntries([]);
    saveToLocalStorage(emptyVault);
  };

  const initializeVault = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load from localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);

          // Handle the vault structure
          if (parsed.vault && Array.isArray(parsed.vault.entries)) {
            console.log('✅ Loaded vault from localStorage:', parsed.vault.entries.length, 'entries');
            setVault(parsed.vault);
            setEntries(parsed.vault.entries);
          } else {
            // Invalid structure, start fresh
            console.log('Invalid vault structure, starting fresh');
            createEmptyVault();
          }
        } catch (parseError) {
          console.error('Failed to parse vault data:', parseError);
          createEmptyVault();
        }
      } else {
        console.log('No existing vault - starting fresh');
        createEmptyVault();
      }
    } catch (err) {
      console.error('Failed to initialize vault:', err);
      setError('Failed to initialize vault');
      createEmptyVault();
    } finally {
      setIsLoading(false);
    }
  };

  const createVault = async () => {
    try {
      setIsLoading(true);
      setError(null);
      createEmptyVault();
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
      setVault(null);
      setEntries([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error locking vault:', err);
      setError('Failed to lock vault');
      throw err;
    }
  };

  const addEntry = async (entryData: Omit<PasswordEntry, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'deviceWhitelist'>) => {
    try {
      if (!vault) throw new Error('No vault loaded');

      const newEntry: PasswordEntry = {
        ...entryData,
        id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        passwordHash: await hash(entryData.username + entryData.domain),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        deviceWhitelist: ['device1'],
      };

      const updatedEntries = [...vault.entries, newEntry];
      const updatedVault = {
        ...vault,
        entries: updatedEntries,
        totalEntries: updatedEntries.length,
        updatedAt: Date.now(),
      };

      setVault(updatedVault);
      setEntries(updatedEntries);
      saveToLocalStorage(updatedVault);

      console.log('✅ Password added successfully!');
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
    recordUsage,
    getVaultInfo,
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