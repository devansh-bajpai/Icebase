/**
 * Cryptographic utilities for RSA handshake and AES encryption on frontend
 */

/**
 * Encrypt data with RSA public key (OAEP padding)
 * @param {string} publicKeyPem - RSA public key in PEM format
 * @param {Uint8Array} data - Data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data
 */
export async function encryptRSA(publicKeyPem, data) {
  try {
    // Import public key
    const publicKey = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(publicKeyPem),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data
    );

    // Convert to base64
    return arrayBufferToBase64(encrypted);
  } catch (error) {
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

/**
 * Generate a random AES-256 key
 * @returns {Promise<CryptoKey>} AES key
 */
export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Export AES key to raw bytes
 * @param {CryptoKey} key - AES key
 * @returns {Promise<Uint8Array>} Key bytes
 */
export async function exportAESKey(key) {
  const exported = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(exported);
}

/**
 * Import AES key from raw bytes
 * @param {Uint8Array} keyBytes - Key bytes
 * @returns {Promise<CryptoKey>} AES key
 */
export async function importAESKey(keyBytes) {
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "AES-CBC",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate a random IV for AES-CBC
 * @returns {Uint8Array} 16-byte IV
 */
export function generateIV() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Encrypt data with AES-256-CBC
 * @param {CryptoKey} key - AES key
 * @param {Uint8Array} data - Data to encrypt
 * @returns {Promise<{data: string, iv: string}>} Encrypted data and IV as base64 strings
 */
export async function encryptAES(key, data) {
  try {
    const iv = generateIV();
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      data
    );

    return {
      data: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    throw new Error(`AES encryption failed: ${error.message}`);
  }
}