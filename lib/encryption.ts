import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-key-change-in-production!'

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString()
}

export function decrypt(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return '[mensaje no descifrable]'
  }
}
