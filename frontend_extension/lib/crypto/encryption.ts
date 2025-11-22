// AES-256-GCM Encryption/Decryption for Vault Data
// ✅ FIXED: TypeScript type errors for Uint8Array compatibility

import { SECURITY } from '@/config/constants';

export interface EncryptedData {
    ciphertext: string; // Base64 encoded
    iv: string; // Base64 encoded
    salt: string; // Base64 encoded
}

/**
 * Generate a random salt
 * ✅ FIX: Cast to Uint8Array to satisfy TypeScript
 */
export function generateSalt(): Uint8Array {
    const array = new Uint8Array(SECURITY.SALT_LENGTH);
    return crypto.getRandomValues(array) as Uint8Array;
}

/**
 * Generate a random IV (Initialization Vector)
 * ✅ FIX: Cast to Uint8Array to satisfy TypeScript
 */
export function generateIV(): Uint8Array {
    const array = new Uint8Array(SECURITY.IV_LENGTH);
    return crypto.getRandomValues(array) as Uint8Array;
}

/**
 * Derive encryption key from password using PBKDF2
 */
export async function deriveKey(
    password: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    // ✅ FIX: Cast salt to satisfy TypeScript
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as Uint8Array<ArrayBuffer>,
            iterations: SECURITY.KEY_DERIVATION_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(
    data: string,
    password: string
): Promise<EncryptedData> {
    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);

        // Generate salt and IV
        const salt = generateSalt();
        const iv = generateIV();

        // Derive encryption key
        const key = await deriveKey(password, salt);

        // Encrypt data
        // ✅ FIX: Cast iv to satisfy TypeScript
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv as Uint8Array<ArrayBuffer>,
                tagLength: SECURITY.TAG_LENGTH * 8, // bits
            },
            key,
            dataBuffer
        );

        // Convert to base64 for storage
        return {
            ciphertext: arrayBufferToBase64(ciphertext),
            iv: arrayBufferToBase64(iv),
            salt: arrayBufferToBase64(salt),
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
    encryptedData: EncryptedData,
    password: string
): Promise<string> {
    try {
        // Convert from base64
        const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
        const iv = base64ToArrayBuffer(encryptedData.iv);
        const salt = base64ToArrayBuffer(encryptedData.salt);

        // Derive decryption key
        // ✅ FIX: Cast salt to satisfy TypeScript
        const key = await deriveKey(password, new Uint8Array(salt) as Uint8Array<ArrayBuffer>);

        // Decrypt data
        // ✅ FIX: Cast iv to satisfy TypeScript
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(iv) as Uint8Array<ArrayBuffer>,
                tagLength: SECURITY.TAG_LENGTH * 8,
            },
            key,
            ciphertext
        );

        // Convert to string
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data - wrong password or corrupted data');
    }
}

/**
 * Hash data using SHA-256
 */
export async function hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return arrayBufferToBase64(hashBuffer);
}

// Helper functions
// ✅ FIX: Accept both ArrayBuffer and Uint8Array
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}