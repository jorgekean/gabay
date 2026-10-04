import CryptoJS from 'crypto-js';

// In a real production app, this key would be securely retrieved from a backend
// and uniquely bound to the school or organization. For the client-side MVP,
// we use a static environment key or default.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'gabay-secure-vault-mvp-key-2026';

export const encryptData = (data: string | undefined): string | undefined => {
  if (!data) return data;
  try {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  } catch (e) {
    console.error('Encryption failed', e);
    return data;
  }
};

export const decryptData = (cipherText: string | undefined): string | undefined => {
  if (!cipherText) return cipherText;
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption yields an empty string but cipherText was not empty, 
    // it likely means the text was not encrypted with this key (e.g. legacy plain text).
    return originalText || cipherText; 
  } catch (error) {
    // If decryption fails (e.g., plain text), return as is
    return cipherText;
  }
};
