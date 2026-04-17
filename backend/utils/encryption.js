const crypto = require('crypto');

/**
 * AES-256-GCM Encryption & Decryption Utility
 *
 * Uses Node.js built-in crypto module — no external dependencies.
 * Encryption key is sourced from ENCRYPTION_KEY env var (64-char hex = 256 bits).
 *
 * Encrypted format: "iv:authTag:ciphertext" (all base64-encoded)
 * This format is self-contained and migration-safe.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment.
 * Validates that it's a proper 256-bit hex key.
 * @returns {Buffer}
 */
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY is not set in environment variables. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (256 bits). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  return Buffer.from(key, 'hex');
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param {string} plaintext - The text to encrypt
 * @returns {string} Encrypted string in format "iv:authTag:ciphertext" (base64)
 */
const encrypt = (plaintext) => {
  if (!plaintext || typeof plaintext !== 'string') {
    return plaintext; // Don't encrypt null/undefined/non-strings
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt an AES-256-GCM encrypted string.
 *
 * @param {string} encryptedStr - Encrypted string in format "iv:authTag:ciphertext"
 * @returns {string} Decrypted plaintext
 */
const decrypt = (encryptedStr) => {
  if (!encryptedStr || typeof encryptedStr !== 'string') {
    return encryptedStr;
  }

  // Migration safety: if it doesn't look encrypted, return as-is
  if (!isEncrypted(encryptedStr)) {
    return encryptedStr;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedStr.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Check if a string appears to be encrypted (contains our iv:authTag:ciphertext format).
 * Used for migration safety — handles both encrypted and plaintext tokens.
 *
 * @param {string} str
 * @returns {boolean}
 */
const isEncrypted = (str) => {
  if (!str || typeof str !== 'string') return false;

  const parts = str.split(':');
  if (parts.length !== 3) return false;

  // Verify each part is valid base64
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
};

/**
 * Generate a random encryption key (for setup/documentation).
 * @returns {string} 64-char hex string
 */
const generateKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  generateKey,
};
