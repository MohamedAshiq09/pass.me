// Walrus Storage Client for Encrypted Vault Data

import { WALRUS_CONFIG } from '@/config/constants';
import { encrypt, decrypt, type EncryptedData } from '@/lib/crypto/encryption';
import type { VaultData } from '@/lib/api/client';

export interface WalrusUploadResponse {
    blobId: string;
    endEpoch: number;
    cost?: number;
}

/**
 * Upload encrypted vault data to Walrus
 */
export async function uploadToWalrus(
    vaultData: VaultData,
    masterPassword: string
): Promise<string> {
    try {
        // Serialize vault data
        const jsonData = JSON.stringify(vaultData);

        // Encrypt data
        const encryptedData = await encrypt(jsonData, masterPassword);

        // Prepare for upload
        const uploadData = JSON.stringify(encryptedData);
        const blob = new Blob([uploadData], { type: 'application/json' });

        // Upload to Walrus publisher
        const url = `${WALRUS_CONFIG.PUBLISHER_URL}/v1/store?epochs=${WALRUS_CONFIG.STORAGE_EPOCHS}`;

        const response = await fetch(url, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Walrus upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Extract blob ID from response
        let blobId: string;
        if (result.newlyCreated) {
            blobId = result.newlyCreated.blobObject.blobId;
        } else if (result.alreadyCertified) {
            blobId = result.alreadyCertified.blobId;
        } else {
            throw new Error('Unexpected Walrus response format');
        }

        console.log('Uploaded to Walrus:', { blobId, endEpoch: result.endEpoch });
        return blobId;
    } catch (error) {
        console.error('Walrus upload error:', error);
        throw new Error('Failed to upload vault to Walrus');
    }
}

/**
 * Download and decrypt vault data from Walrus
 */
export async function downloadFromWalrus(
    blobId: string,
    masterPassword: string
): Promise<VaultData> {
    try {
        // Download from Walrus aggregator
        const url = `${WALRUS_CONFIG.AGGREGATOR_URL}/v1/${blobId}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Walrus download failed: ${response.statusText}`);
        }

        const encryptedDataStr = await response.text();
        const encryptedData: EncryptedData = JSON.parse(encryptedDataStr);

        // Decrypt data
        const decryptedStr = await decrypt(encryptedData, masterPassword);
        const vaultData: VaultData = JSON.parse(decryptedStr);

        console.log('Downloaded from Walrus:', { blobId, entriesCount: vaultData.entries.length });
        return vaultData;
    } catch (error) {
        console.error('Walrus download error:', error);
        throw new Error('Failed to download vault from Walrus');
    }
}

/**
 * Check if a blob exists on Walrus
 */
export async function checkBlobExists(blobId: string): Promise<boolean> {
    try {
        const url = `${WALRUS_CONFIG.AGGREGATOR_URL}/v1/${blobId}`;
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Walrus blob check error:', error);
        return false;
    }
}

/**
 * Get blob metadata from Walrus
 */
export async function getBlobMetadata(blobId: string): Promise<{
    size: number;
    contentType: string;
} | null> {
    try {
        const url = `${WALRUS_CONFIG.AGGREGATOR_URL}/v1/${blobId}`;
        const response = await fetch(url, { method: 'HEAD' });

        if (!response.ok) return null;

        return {
            size: parseInt(response.headers.get('content-length') || '0'),
            contentType: response.headers.get('content-type') || 'application/octet-stream',
        };
    } catch (error) {
        console.error('Walrus metadata error:', error);
        return null;
    }
}
