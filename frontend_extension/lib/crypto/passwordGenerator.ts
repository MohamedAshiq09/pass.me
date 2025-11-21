// Password Generator with Deterministic and Random Options

import { PASSWORD_GENERATOR, SECURITY } from '@/config/constants';

export interface PasswordOptions {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a random password
 */
export function generateRandomPassword(options: PasswordOptions = {}): string {
    const {
        length = PASSWORD_GENERATOR.DEFAULT_LENGTH,
        includeUppercase = PASSWORD_GENERATOR.INCLUDE_UPPERCASE,
        includeLowercase = PASSWORD_GENERATOR.INCLUDE_LOWERCASE,
        includeNumbers = PASSWORD_GENERATOR.INCLUDE_NUMBERS,
        includeSymbols = PASSWORD_GENERATOR.INCLUDE_SYMBOLS,
    } = options;

    // Build character set
    let charset = '';
    if (includeUppercase) charset += UPPERCASE;
    if (includeLowercase) charset += LOWERCASE;
    if (includeNumbers) charset += NUMBERS;
    if (includeSymbols) charset += SYMBOLS;

    if (charset.length === 0) {
        charset = LOWERCASE + NUMBERS; // Fallback
    }

    // Generate password
    const password = new Array(length);
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        password[i] = charset[randomValues[i] % charset.length];
    }

    return password.join('');
}

/**
 * Generate a deterministic password using PBKDF2
 * This allows regenerating the same password from the same inputs
 */
export async function generateDeterministicPassword(
    privateKey: string,
    domain: string,
    timestamp: number,
    options: PasswordOptions = {}
): Promise<string> {
    const {
        length = PASSWORD_GENERATOR.DEFAULT_LENGTH,
        includeUppercase = PASSWORD_GENERATOR.INCLUDE_UPPERCASE,
        includeLowercase = PASSWORD_GENERATOR.INCLUDE_LOWERCASE,
        includeNumbers = PASSWORD_GENERATOR.INCLUDE_NUMBERS,
        includeSymbols = PASSWORD_GENERATOR.INCLUDE_SYMBOLS,
    } = options;

    // Build character set
    let charset = '';
    if (includeUppercase) charset += UPPERCASE;
    if (includeLowercase) charset += LOWERCASE;
    if (includeNumbers) charset += NUMBERS;
    if (includeSymbols) charset += SYMBOLS;

    if (charset.length === 0) {
        charset = LOWERCASE + NUMBERS;
    }

    // Create input for PBKDF2
    const input = `${privateKey}:${domain}:${timestamp}`;
    const encoder = new TextEncoder();
    const inputBuffer = encoder.encode(input);

    // Use domain as salt
    const salt = encoder.encode(domain);

    // Import key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        inputBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive bits
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: SECURITY.KEY_DERIVATION_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        length * 8 // bits
    );

    // Convert bits to password
    const bytes = new Uint8Array(derivedBits);
    const password = new Array(length);

    for (let i = 0; i < length; i++) {
        password[i] = charset[bytes[i] % charset.length];
    }

    return password.join('');
}

/**
 * Calculate password strength (0-100)
 */
export function calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let score = 0;

    // Length score (max 40 points)
    score += Math.min(password.length * 2, 40);

    // Character variety (max 60 points)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    if (hasUppercase) score += 15;
    if (hasLowercase) score += 15;
    if (hasNumbers) score += 15;
    if (hasSymbols) score += 15;

    return Math.min(score, 100);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
    if (strength < 30) return '#ef4444'; // red
    if (strength < 60) return '#f59e0b'; // orange
    if (strength < 80) return '#3b82f6'; // blue
    return '#10b981'; // green
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < PASSWORD_GENERATOR.MIN_LENGTH) {
        errors.push(`Password must be at least ${PASSWORD_GENERATOR.MIN_LENGTH} characters`);
    }

    if (password.length > PASSWORD_GENERATOR.MAX_LENGTH) {
        errors.push(`Password must be at most ${PASSWORD_GENERATOR.MAX_LENGTH} characters`);
    }

    const strength = calculatePasswordStrength(password);
    if (strength < 30) {
        errors.push('Password is too weak');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
