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
        console.log('📤 Preparing to upload to Walrus...');

        // Serialize vault data
        const jsonData = JSON.stringify(vaultData);
        console.log('📝 Vault data size:', jsonData.length, 'bytes');

        // Encrypt data
        const encryptedData = await encrypt(jsonData, masterPassword);
        console.log('🔐 Data encrypted successfully');

        // Prepare for upload - convert to blob
        const uploadData = JSON.stringify(encryptedData);
        const blob = new Blob([uploadData], { type: 'application/octet-stream' });

        console.log('📦 Encrypted blob size:', blob.size, 'bytes');

        // Upload to Walrus publisher
        const url = `${WALRUS_CONFIG.PUBLISHER_URL}/v1/store?epochs=${WALRUS_CONFIG.STORAGE_EPOCHS}`;

        console.log('🌐 Uploading to:', url);

        const response = await fetch(url, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        console.log('📡 Walrus response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Walrus upload failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Walrus upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📋 Walrus response:', result);

        // Extract blob ID from response
        let blobId: string;
        if (result.newlyCreated) {
            blobId = result.newlyCreated.blobObject.blobId;
            console.log('✅ New blob created:', blobId);
        } else if (result.alreadyCertified) {
            blobId = result.alreadyCertified.blobId;
            console.log('♻️ Blob already exists:', blobId);
        } else {
            console.error('❌ Unexpected response format:', result);
            throw new Error('Unexpected Walrus response format');
        }

        console.log('✅ Uploaded to Walrus:', {
            blobId,
            endEpoch: result.endEpoch || result.newlyCreated?.endEpoch
        });

        return blobId;
    } catch (error) {
        console.error('💥 Walrus upload error:', error);

        // More detailed error message
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Failed to connect to Walrus - check network connection');
        }

        throw new Error('Failed to upload vault to Walrus: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        console.log('📥 Downloading from Walrus, blob ID:', blobId);

        // Download from Walrus aggregator
        const url = `${WALRUS_CONFIG.AGGREGATOR_URL}/v1/${blobId}`;

        console.log('🌐 Fetching from:', url);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Walrus download failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Walrus download failed: ${response.status} - ${errorText}`);
        }

        const encryptedDataStr = await response.text();
        console.log('📦 Downloaded encrypted data, size:', encryptedDataStr.length, 'bytes');

        const encryptedData: EncryptedData = JSON.parse(encryptedDataStr);

        // Decrypt data
        console.log('🔓 Decrypting data...');
        const decryptedStr = await decrypt(encryptedData, masterPassword);
        const vaultData: VaultData = JSON.parse(decryptedStr);

        console.log('✅ Downloaded from Walrus:', {
            blobId,
            entriesCount: vaultData.entries.length
        });

        return vaultData;
    } catch (error) {
        console.error('💥 Walrus download error:', error);

        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Failed to connect to Walrus - check network connection');
        }

        throw new Error('Failed to download vault from Walrus: ' + (error instanceof Error ? error.message : 'Unknown error'));
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