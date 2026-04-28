/**
 * Password Vault — AES-256-GCM encryption/decryption
 * Uses a master password to derive an encryption key via PBKDF2.
 * The master password hash (bcrypt-style via scrypt) is stored in the DB for validation.
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;

/**
 * Derives a 256-bit key from a master password + salt using PBKDF2
 */
function deriveKey(masterPassword: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterPassword, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Output format: base64(salt + iv + tag + ciphertext)
 */
export function encrypt(plaintext: string, masterPassword: string): string {
  if (!plaintext) return '';
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterPassword, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine: salt(16) + iv(12) + tag(16) + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt a ciphertext that was produced by encrypt().
 */
export function decrypt(encryptedBase64: string, masterPassword: string): string {
  if (!encryptedBase64) return '';
  try {
    const combined = Buffer.from(encryptedBase64, 'base64');
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(masterPassword, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return ''; // Wrong master password or corrupted data
  }
}

/**
 * Hash a master password for storage (using scrypt)
 */
export function hashMasterPassword(password: string): string {
  const salt = crypto.randomBytes(32);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

/**
 * Verify a master password against a stored hash
 */
export function verifyMasterPassword(password: string, stored: string): boolean {
  try {
    const [saltHex, hashHex] = stored.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const storedHash = Buffer.from(hashHex, 'hex');
    const hash = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(hash, storedHash);
  } catch {
    return false;
  }
}
