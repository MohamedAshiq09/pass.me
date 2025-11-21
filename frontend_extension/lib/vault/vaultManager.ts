// Vault Manager - Orchestrates vault operations with encryption, Walrus, and Sui

import { apiClient, type VaultData, type PasswordEntry } from '@/lib/api/client';
import { uploadToWalrus, downloadFromWalrus } from '@/lib/walrus/client';
import { hash } from '@/lib/crypto/encryption';
import { STORAGE_KEYS } from '@/config/constants';

export interface VaultInfo {
    id: string;
    owner: string;
    walrusBlobId: string;
    capabilityId: string;
    createdAt: number;
    updatedAt: number;
    totalEntries: number;
    isLocked: boolean;
}

export class VaultManager {
    private masterPassword: string | null = null;
    private currentVault: VaultInfo | null = null;

    /**
     * Initialize vault manager with master password
     */
    async initialize(masterPassword: string): Promise<void> {
        this.masterPassword = masterPassword;
    }

    /**
     * Create a new vault
     */
    async createVault(owner: string): Promise<VaultInfo> {
        if (!this.masterPassword) {
            throw new Error('Vault manager not initialized');
        }

        try {
            // Create empty vault data
            const emptyVaultData: VaultData = {
                entries: [],
                metadata: {
                    version: '1.0.0',
                    lastModified: Date.now(),
                },
            };

            // Upload to Walrus
            const blobId = await uploadToWalrus(emptyVaultData, this.masterPassword);

            // Create vault on blockchain via backend
            const response = await apiClient.createVault(blobId);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to create vault');
            }

            // Store vault info locally
            const vaultInfo: VaultInfo = {
                id: `vault_${Date.now()}`, // Will be replaced with actual ID from blockchain
                owner,
                walrusBlobId: blobId,
                capabilityId: '', // Will be set after transaction
                createdAt: Date.now(),
                updatedAt: Date.now(),
                totalEntries: 0,
                isLocked: false,
            };

            this.currentVault = vaultInfo;
            this.saveVaultInfoToStorage(vaultInfo);

            return vaultInfo;
        } catch (error) {
            console.error('Failed to create vault:', error);
            throw error;
        }
    }

    /**
     * Load vault from Walrus
     */
    async loadVault(vaultId: string): Promise<VaultData> {
        if (!this.masterPassword) {
            throw new Error('Vault manager not initialized');
        }

        try {
            // Get vault info from blockchain
            const response = await apiClient.getVault(vaultId);

            if (!response.success || !response.data) {
                throw new Error('Vault not found');
            }

            const vaultInfo = response.data;
            const blobId = vaultInfo.walrus_blob_id;

            if (!blobId) {
                throw new Error('Vault has no Walrus blob ID');
            }

            // Download and decrypt from Walrus
            const vaultData = await downloadFromWalrus(blobId, this.masterPassword);

            // Update current vault
            this.currentVault = {
                id: vaultId,
                owner: vaultInfo.owner,
                walrusBlobId: blobId,
                capabilityId: '', // Should be retrieved from storage
                createdAt: vaultInfo.created_at,
                updatedAt: vaultInfo.updated_at,
                totalEntries: vaultData.entries.length,
                isLocked: vaultInfo.is_locked,
            };

            return vaultData;
        } catch (error) {
            console.error('Failed to load vault:', error);
            throw error;
        }
    }

    /**
     * Save vault data (encrypt and upload to Walrus, update blockchain)
     */
    async saveVault(vaultData: VaultData): Promise<void> {
        if (!this.masterPassword || !this.currentVault) {
            throw new Error('Vault manager not initialized or no vault loaded');
        }

        try {
            // Update metadata
            vaultData.metadata = {
                version: '1.0.0',
                lastModified: Date.now(),
            };

            // Upload to Walrus
            const newBlobId = await uploadToWalrus(vaultData, this.masterPassword);

            // Update vault on blockchain
            if (this.currentVault.capabilityId) {
                await apiClient.updateVault(
                    this.currentVault.id,
                    newBlobId,
                    this.currentVault.capabilityId
                );
            }

            // Update local vault info
            this.currentVault.walrusBlobId = newBlobId;
            this.currentVault.updatedAt = Date.now();
            this.currentVault.totalEntries = vaultData.entries.length;

            this.saveVaultInfoToStorage(this.currentVault);
        } catch (error) {
            console.error('Failed to save vault:', error);
            throw error;
        }
    }

    /**
     * Add password entry
     */
    async addEntry(
        vaultData: VaultData,
        entry: Omit<PasswordEntry, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'deviceWhitelist'>
    ): Promise<PasswordEntry> {
        const newEntry: PasswordEntry = {
            ...entry,
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            passwordHash: await hash(entry.username + entry.domain), // Simple hash for breach detection
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
            deviceWhitelist: [this.getDeviceId()],
        };

        vaultData.entries.push(newEntry);
        await this.saveVault(vaultData);

        return newEntry;
    }

    /**
     * Update password entry
     */
    async updateEntry(
        vaultData: VaultData,
        entryId: string,
        updates: Partial<PasswordEntry>
    ): Promise<PasswordEntry> {
        const entryIndex = vaultData.entries.findIndex(e => e.id === entryId);

        if (entryIndex === -1) {
            throw new Error('Entry not found');
        }

        vaultData.entries[entryIndex] = {
            ...vaultData.entries[entryIndex],
            ...updates,
            updatedAt: Date.now(),
        };

        await this.saveVault(vaultData);

        return vaultData.entries[entryIndex];
    }

    /**
     * Delete password entry
     */
    async deleteEntry(vaultData: VaultData, entryId: string): Promise<void> {
        vaultData.entries = vaultData.entries.filter(e => e.id !== entryId);
        await this.saveVault(vaultData);
    }

    /**
     * Get device ID (create if doesn't exist)
     */
    private getDeviceId(): string {
        let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);

        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
        }

        return deviceId;
    }

    /**
     * Save vault info to local storage
     */
    private saveVaultInfoToStorage(vaultInfo: VaultInfo): void {
        localStorage.setItem('current_vault', JSON.stringify(vaultInfo));
    }

    /**
     * Load vault info from local storage
     */
    loadVaultInfoFromStorage(): VaultInfo | null {
        const stored = localStorage.getItem('current_vault');
        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }

    /**
     * Clear vault manager
     */
    clear(): void {
        this.masterPassword = null;
        this.currentVault = null;
    }
}

// Singleton instance
export const vaultManager = new VaultManager();
