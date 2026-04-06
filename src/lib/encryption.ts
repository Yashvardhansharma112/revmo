import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Versioned prefix prevents silent double-encryption
const ENC_PREFIX = 'enc:v1:';

/**
 * Ensures a valid 32-byte key exists for AES-256.
 * Throws in production if ENCRYPTION_KEY is not set.
 */
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[encryption] ENCRYPTION_KEY is not set. Refusing to operate in production without it.'
      );
    }
    console.warn(
      '⚠️  ENCRYPTION_KEY is missing. Using dev fallback — NEVER use in production.'
    );
    return Buffer.alloc(32, 'dev-fallback-key-do-not-use-prod!');
  }

  // Check byte length, not character length (UTF-8 multi-byte chars)
  const keyBuffer = Buffer.from(key, 'utf8');
  if (keyBuffer.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes long, got ${keyBuffer.length} bytes`
    );
  }

  return keyBuffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Idempotent: already-encrypted strings (prefixed with enc:v1:) are returned as-is.
 * @param text The plain text to encrypt
 * @returns Prefixed base64 string: `enc:v1:<iv+tag+ciphertext>`
 */
export function encrypt(text: string): string {
  if (!text) return text;

  // Idempotency guard: never double-encrypt
  if (text.startsWith(ENC_PREFIX)) return text;

  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: IV (16) + Tag (16) + Ciphertext
    const result = Buffer.concat([iv, tag, encrypted]);
    return ENC_PREFIX + result.toString('base64');
  } catch (e) {
    console.error('[encryption] Encryption error:', e);
    throw new Error('[encryption] Failed to encrypt value. Check ENCRYPTION_KEY.');
  }
}

/**
 * Decrypts a prefixed base64 string produced by `encrypt`.
 * Returns the original plaintext, or null if decryption fails.
 * Returns plaintext as-is if it was never encrypted (legacy/plain strings).
 * @param encryptedText The string to decrypt
 * @returns Decrypted plaintext, or null on failure
 */
export function decrypt(encryptedText: string): string | null {
  if (!encryptedText) return encryptedText;

  // Plaintext passthrough: value was stored before encryption was introduced
  if (!encryptedText.startsWith(ENC_PREFIX)) {
    return encryptedText;
  }

  try {
    const raw = encryptedText.slice(ENC_PREFIX.length);
    const buf = Buffer.from(raw, 'base64');

    if (buf.length <= IV_LENGTH + TAG_LENGTH) {
      console.error('[encryption] Ciphertext too short — corrupted value.');
      return null;
    }

    const key = getKey();
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
  } catch {
    // Wrong key, corrupted value, or key rotation — do NOT return ciphertext
    console.error('[encryption] Decryption failed. Key mismatch or corrupt data.');
    return null;
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
