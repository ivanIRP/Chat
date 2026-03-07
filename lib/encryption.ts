import CryptoJS from 'crypto-js'

// Safe environment variable retrieval
function getSecretKey(): string {
  try {
    const key = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    if (key && typeof key === 'string' && key.trim() !== '') {
      return key.trim()
    }
    console.warn('[Encryption] Using fallback key - change in production!')
    return 'fallback-key-change-in-production!'
  } catch {
    console.warn('[Encryption] Error reading key, using fallback')
    return 'fallback-key-change-in-production!'
  }
}

const SECRET_KEY = getSecretKey()

export function encrypt(text: string): string {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('[Encryption] Invalid input for encryption')
      return ''
    }
    
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      return ''
    }
    
    const encrypted = CryptoJS.AES.encrypt(trimmedText, SECRET_KEY)
    if (!encrypted) {
      console.error('[Encryption] Encryption returned null')
      return ''
    }
    
    return encrypted.toString()
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error instanceof Error ? error.message : 'Unknown error')
    return ''
  }
}

export function decrypt(ciphertext: string): string {
  try {
    // Validate input
    if (!ciphertext || typeof ciphertext !== 'string') {
      return '[mensaje vacío]'
    }
    
    const trimmedCiphertext = ciphertext.trim()
    if (trimmedCiphertext.length === 0) {
      return '[mensaje vacío]'
    }
    
    const bytes = CryptoJS.AES.decrypt(trimmedCiphertext, SECRET_KEY)
    if (!bytes) {
      return '[mensaje no descifrable]'
    }
    
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted || decrypted.length === 0) {
      return '[mensaje no descifrable]'
    }
    
    return decrypted
  } catch (error) {
    console.error('[Decryption] Decryption failed:', error instanceof Error ? error.message : 'Unknown error')
    return '[mensaje no descifrable]'
  }
}

// Verify encryption is working
export function testEncryption(): boolean {
  try {
    const testString = 'test-encryption-' + Date.now()
    const encrypted = encrypt(testString)
    if (!encrypted) return false
    const decrypted = decrypt(encrypted)
    return decrypted === testString
  } catch {
    return false
  }
}
