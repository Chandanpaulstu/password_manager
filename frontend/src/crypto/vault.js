const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 256

// Convert string to ArrayBuffer
const enc = new TextEncoder()
const dec = new TextDecoder()

// Derive AES-256-GCM key from master password + salt
export async function deriveKey(masterPassword, saltHex) {
  const saltBuffer = hexToBuffer(saltHex)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt plaintext object → { data_encrypted, iv }
export async function encryptData(key, plainObject) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = enc.encode(JSON.stringify(plainObject))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  return {
    data_encrypted: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv)
  }
}

// Decrypt ciphertext → plain object
export async function decryptData(key, dataEncrypted, ivBase64) {
  const ciphertext = base64ToBuffer(dataEncrypted)
  const iv = base64ToBuffer(ivBase64)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return JSON.parse(dec.decode(decrypted))
}

// Encrypt title string separately (for listing without full decrypt)
export async function encryptTitle(key, title) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(title)
  )
  // pack iv+ciphertext together as base64
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return bufferToBase64(combined)
}

export async function decryptTitle(key, encryptedBase64) {
  const combined = base64ToBuffer(encryptedBase64)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return dec.decode(decrypted)
}

// Helpers
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  return bytes.buffer
}