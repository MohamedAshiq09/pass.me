// ✅ FIXED Walrus Storage Client - Solves 522 timeout errors

import { encrypt, decrypt, type EncryptedData } from '@/lib/crypto/encryption';
import type { VaultData } from '@/lib/api/client';

// ✅ USE TESTNET (not devnet!)
const WALRUS_CONFIG = {
    AGGREGATOR_URL: 'https://aggregator.walrus-testnet.walrus.space',
    PUBLISHER_URL: 'https://publisher.walrus-testnet.walrus.space',
    STORAGE_EPOCHS: 5,
    USE_BACKEND_PROXY: true, // ✅ Recommended to avoid browser limitations
};

const API_BACKEND_URL = 'http://localhost:3001';

export interface WalrusUploadResponse {
    blobId: string;
    endEpoch: number;
    cost?: number;
}

/**
 * ✅ FIXED: Upload encrypted vault data to Walrus
 * 
 * Uses backend proxy by default to avoid:
 * - 522 timeout errors
 * - CORS issues
 * - Browser connection limits (~2200 requests per blob)
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

        // Prepare for upload
        const uploadData = JSON.stringify(encryptedData);
        console.log('📦 Encrypted blob size:', uploadData.length, 'bytes');

        // ✅ SOLUTION 1: Use backend proxy (RECOMMENDED)
        if (WALRUS_CONFIG.USE_BACKEND_PROXY) {
            return await uploadViaBackend(encryptedData);
        }

        // ✅ SOLUTION 2: Direct upload (may still get 522 errors)
        return await uploadDirect(uploadData);

    } catch (error) {
        console.error('💥 Walrus upload error:', error);

        // Better error messages
        if (error instanceof Error) {
            if (error.message.includes('522')) {
                throw new Error(
                    'Walrus publisher timeout (522). ' +
                    'This is a known issue with direct browser uploads. ' +
                    'Solution: Enable backend proxy in settings or try again.'
                );
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error(
                    'Failed to connect to Walrus. ' +
                    'Check your network connection or try using backend proxy.'
                );
            }
        }

        throw new Error(
            'Failed to upload vault to Walrus: ' +
            (error instanceof Error ? error.message : 'Unknown error')
        );
    }
}

/**
 * Upload via backend proxy (solves all browser issues)
 */
async function uploadViaBackend(encryptedData: EncryptedData): Promise<string> {
    console.log('🔄 Uploading via backend proxy...');

    const response = await fetch(`${API_BACKEND_URL}/api/vault/data/store`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vaultData: encryptedData }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend upload failed:', {
            status: response.status,
            error: errorText
        });
        throw new Error(`Backend upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success || !result.data?.blobId) {
        throw new Error(result.error || 'Backend returned invalid response');
    }

    const blobId = result.data.blobId;
    console.log('✅ Uploaded via backend proxy:', blobId);

    return blobId;
}

/**
 * Direct upload to Walrus (may timeout)
 */
async function uploadDirect(uploadData: string): Promise<string> {
    console.log('⚠️ Direct upload - may experience 522 timeouts');
    console.log('🌐 Uploading to:', `${WALRUS_CONFIG.PUBLISHER_URL}/v1/store`);

    const blob = new Blob([uploadData], { type: 'application/octet-stream' });
    const url = `${WALRUS_CONFIG.PUBLISHER_URL}/v1/store?epochs=${WALRUS_CONFIG.STORAGE_EPOCHS}`;

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

        if (response.status === 522) {
            throw new Error(
                `Walrus upload timeout (522). ` +
                `The publisher server took too long to respond. ` +
                `Try: 1) Use backend proxy, 2) Reduce file size, 3) Try again later`
            );
        }

        throw new Error(`Walrus upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📋 Walrus response:', result);

    // Extract blob ID
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

    return blobId;
}

/**
 * Download and decrypt vault data from Walrus
 * ✅ This usually works fine
 */
export async function downloadFromWalrus(
    blobId: string,
    masterPassword: string
): Promise<VaultData> {
    try {
        console.log('📥 Downloading from Walrus, blob ID:', blobId);

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

        throw new Error(
            'Failed to download vault from Walrus: ' +
            (error instanceof Error ? error.message : 'Unknown error')
        );
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