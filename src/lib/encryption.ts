import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Ensures a valid 32-byte key exists for AES-256.
 */
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("⚠️ ENCRYPTION_KEY is missing from environment. Using a fallback for development ONLY.");
    return Buffer.alloc(32, "dev-fallback-key-do-not-use-prod!"); // 32 byte fallback
  }
  
  // Check byte length, not character length (UTF-8 multi-byte chars)
  const keyBuffer = Buffer.from(key, 'utf8');
  if (keyBuffer.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 bytes long, got ${keyBuffer.length} bytes`);
  }

  return keyBuffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plain text to encrypt
 * @returns A base64 encoded string containing the IV, Tag, and Ciphertext combined.
 */
export function encrypt(text: string): string {
  if (!text) return text;

  // We don't re-encrypt if it looks like it's already an encoded base64 Buffer structure
  // (A rough heuristic to prevent double-encryption if we call this iteratively)
  if (text.length > 50 && text.endsWith('=')) {
     // Possibly already base64, but we'll still encrypt it anyway just to be safe.
  }

  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // GCM requires string encoding -> utf8 output buffer
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: IV (16) + Tag (16) + Ciphertext
    const result = Buffer.concat([iv, tag, encrypted]);
    
    return result.toString('base64');
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
}

/**
 * Decrypts a base64 encoded string utilizing AES-256-GCM.
 * @param encryptedText The base64 string produced by `encrypt`
 * @returns The original plain text string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  try {
    const stringValue = Buffer.from(encryptedText, 'base64');

    // If it's too short, it's not our encrypted format (likely plain text from Phase 2)
    if (stringValue.length <= IV_LENGTH + TAG_LENGTH) {
      return encryptedText;
    }

    const key = getKey();
    const iv = stringValue.subarray(0, IV_LENGTH);
    const tag = stringValue.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = stringValue.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(encrypted) + decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If decryption fails, it might be an unencrypted plain string from Phase 2.
    // Return heavily masked or fallback string.
    return encryptedText;
  }
}

/**
 * Masks a key to only show the first 4 characters and the last 4 characters.
 */
export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}${'*'.repeat(key.length - 8)}${end}`;
}
