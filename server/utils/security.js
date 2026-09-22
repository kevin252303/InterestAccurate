const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ia_sec_jwt_super_prod_secret_key_99812739';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash a plain text password or PIN using bcrypt
 */
function hashPassword(plainText) {
  if (!plainText) return '';
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

/**
 * Checks if a string is already a bcrypt hash
 */
function isBcryptHash(str) {
  if (typeof str !== 'string') return false;
  return str.startsWith('$2a$') || str.startsWith('$2b$');
}

/**
 * Verify plain text password against stored value.
 * Supports backward compatibility for legacy plaintext passwords.
 */
function verifyPassword(plainText, storedHashOrPlain) {
  if (!plainText || !storedHashOrPlain) return false;
  if (isBcryptHash(storedHashOrPlain)) {
    try {
      return bcrypt.compareSync(plainText, storedHashOrPlain);
    } catch (e) {
      return false;
    }
  }
  // Plaintext comparison for un-migrated accounts
  return plainText === storedHashOrPlain;
}

/**
 * Issue a cryptographically signed JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  generateToken,
  verifyToken,
  JWT_SECRET
};
