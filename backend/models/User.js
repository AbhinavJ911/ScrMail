const mongoose = require('mongoose');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');

/**
 * User Model
 *
 * Stores Google OAuth user profiles with encrypted tokens.
 * Access tokens and refresh tokens are encrypted at rest using AES-256-GCM.
 * Migration-safe: handles both encrypted and plaintext tokens gracefully.
 */

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  accessToken: {
    type: String,
    // Stored encrypted — never expose directly
  },
  refreshToken: {
    type: String,
    // Stored encrypted — never expose directly
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Encryption Hooks ──────────────────────────────────────────────────

/**
 * Pre-save hook: Encrypt access and refresh tokens before saving to MongoDB.
 * Only encrypts if the token has been modified and isn't already encrypted.
 */
userSchema.pre('save', function (next) {
  try {
    // Encrypt accessToken if modified and not already encrypted
    if (this.isModified('accessToken') && this.accessToken) {
      if (!isEncrypted(this.accessToken)) {
        this.accessToken = encrypt(this.accessToken);
      }
    }

    // Encrypt refreshToken if modified and not already encrypted
    if (this.isModified('refreshToken') && this.refreshToken) {
      if (!isEncrypted(this.refreshToken)) {
        this.refreshToken = encrypt(this.refreshToken);
      }
    }

    // Update lastLoginAt on token changes
    if (this.isModified('accessToken')) {
      this.lastLoginAt = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ── Decryption Methods ────────────────────────────────────────────────

/**
 * Get the decrypted access token.
 * Migration-safe: returns plaintext tokens as-is (for pre-encryption data).
 * @returns {string|null}
 */
userSchema.methods.getDecryptedAccessToken = function () {
  if (!this.accessToken) return null;
  try {
    return decrypt(this.accessToken);
  } catch (error) {
    // If decryption fails, token might be plaintext (pre-migration)
    return this.accessToken;
  }
};

/**
 * Get the decrypted refresh token.
 * Migration-safe: returns plaintext tokens as-is (for pre-encryption data).
 * @returns {string|null}
 */
userSchema.methods.getDecryptedRefreshToken = function () {
  if (!this.refreshToken) return null;
  try {
    return decrypt(this.refreshToken);
  } catch (error) {
    return this.refreshToken;
  }
};

/**
 * Return a sanitized user object (no tokens, no sensitive data).
 * Used for API responses.
 * @returns {object}
 */
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
