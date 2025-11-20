import crypto from 'crypto';

/**
 * Hash a string using SHA-256
 */
export const sha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Hash a buffer using SHA-256
 */
export const sha256Buffer = (data: Buffer): Buffer => {
  return crypto.createHash('sha256').update(data).digest();
};

/**
 * Generate random bytes
 */
export const randomBytes = (size: number = 32): Buffer => {
  return crypto.randomBytes(size);
};

/**
 * Generate random hex string
 */
export const randomHex = (size: number = 32): string => {
  return randomBytes(size).toString('hex');
};

/**
 * Encrypt data using AES-256-GCM
 */
export const encrypt = (
  data: string,
  key: Buffer
): { encrypted: string; iv: string; tag: string } => {
  const iv = randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
};

/**
 * Decrypt data using AES-256-GCM
 */
export const decrypt = (
  encrypted: string,
  key: Buffer,
  iv: string,
  tag: string
): string => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Generate device fingerprint
 */
export const generateDeviceFingerprint = (userAgent: string, ip: string): string => {
  const data = `${userAgent}:${ip}`;
  return sha256(data);
};

/**
 * Hash IP address for privacy
 */
export const hashIP = (ip: string): string => {
  return sha256(ip);
};

export default {
  sha256,
  sha256Buffer,
  randomBytes,
  randomHex,
  encrypt,
  decrypt,
  generateDeviceFingerprint,
  hashIP,
};