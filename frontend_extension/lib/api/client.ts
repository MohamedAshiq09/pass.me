// Backend API Client for Pass.me Extension

import { API_ENDPOINTS } from '@/config/constants';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface VaultData {
    entries: PasswordEntry[];
    metadata?: {
        version: string;
        lastModified: number;
    };
}

export interface PasswordEntry {
    id: string;
    domain: string;
    username: string;
    password: string; // The actual password (encrypted in storage)
    passwordHash: string; // Hash for breach detection
    category: string;
    notes?: string;
    favorite: boolean;
    createdAt: number;
    updatedAt: number;
    lastUsed?: number;
    usageCount: number;
    deviceWhitelist: string[];
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_ENDPOINTS.BACKEND_URL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Health check
    async healthCheck(): Promise<ApiResponse> {
        return this.request('/api/health');
    }

    // Vault operations
    async createVault(walrusBlobId: string): Promise<ApiResponse<{ transaction: string }>> {
        return this.request('/api/vault', {
            method: 'POST',
            body: JSON.stringify({ walrus_blob_id: walrusBlobId }),
        });
    }

    async getVault(vaultId: string): Promise<ApiResponse> {
        return this.request(`/api/vault/${vaultId}`);
    }

    async getVaultsByOwner(owner: string): Promise<ApiResponse> {
        return this.request(`/api/vault/owner/${owner}`);
    }

    async updateVault(
        vaultId: string,
        walrusBlobId: string,
        vaultCapId: string
    ): Promise<ApiResponse<{ transaction: string }>> {
        return this.request(`/api/vault/${vaultId}`, {
            method: 'PUT',
            body: JSON.stringify({
                vault_id: vaultId,
                walrus_blob_id: walrusBlobId,
                vaultCapId,
            }),
        });
    }

    async lockVault(vaultId: string, vaultCapId: string): Promise<ApiResponse> {
        return this.request(`/api/vault/${vaultId}/lock`, {
            method: 'POST',
            body: JSON.stringify({ vaultCapId }),
        });
    }

    async unlockVault(vaultId: string, vaultCapId: string): Promise<ApiResponse> {
        return this.request(`/api/vault/${vaultId}/unlock`, {
            method: 'POST',
            body: JSON.stringify({ vaultCapId }),
        });
    }

    async getVaultData(vaultId: string): Promise<ApiResponse<VaultData>> {
        return this.request(`/api/vault/${vaultId}/data`);
    }

    async storeVaultData(vaultData: VaultData): Promise<ApiResponse<{ blobId: string }>> {
        return this.request('/api/vault/data/store', {
            method: 'POST',
            body: JSON.stringify({ vaultData }),
        });
    }

    async getPasswordEntries(vaultId: string): Promise<ApiResponse> {
        return this.request(`/api/vault/${vaultId}/entries`);
    }

    // Alerts
    async getAlerts(userId: string): Promise<ApiResponse> {
        return this.request(`/api/alerts/${userId}`);
    }

    async markAlertAsRead(alertId: string): Promise<ApiResponse> {
        return this.request(`/api/alerts/${alertId}/read`, {
            method: 'POST',
        });
    }

    // Activity
    async getActivity(userId: string): Promise<ApiResponse> {
        return this.request(`/api/activity/${userId}`);
    }
}

export const apiClient = new ApiClient();
