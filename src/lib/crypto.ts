import crypto from 'crypto';
import { getEncryptionKey } from '@/lib/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const MIN_KEY_LENGTH = 32;

function validateEncryptionKey() {
  const encryptionKey = getEncryptionKey();
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (encryptionKey.length < MIN_KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be at least ${MIN_KEY_LENGTH} characters long`);
  }

  // Ensure the key is valid for the algorithm
  try {
    crypto.createCipheriv(ALGORITHM, 
      crypto.pbkdf2Sync(encryptionKey, 'test', 1, 32, 'sha256'),
      Buffer.alloc(IV_LENGTH)
    );
  } catch (error) {
    throw new Error('Invalid ENCRYPTION_KEY: Unable to create cipher');
  }

  return encryptionKey;
}

export async function encrypt(text: string): Promise<string> {
  if (!text) {
    console.error('Encryption error: Empty text provided');
    throw new Error('Text to encrypt cannot be empty');
  }

  console.log('Encryption - Starting encryption process');
  
  try {
    validateEncryptionKey();
  } catch (error) {
    console.error('Encryption key validation failed:', error);
    throw error;
  }

  try {
    const encryptionKey = validateEncryptionKey();
    console.log('Encryption - Generating IV and salt');
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    console.log('Encryption - Deriving key');
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');
    
    console.log('Encryption - Creating cipher');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    console.log('Encryption - Encrypting data');
    const encrypted = cipher.update(text, 'utf8', 'hex');
    const final = cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Combine all components
    console.log('Encryption - Combining components');
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted + final, 'hex')
    ]);
    
    console.log('Encryption - Encoding result');
    const result = combined.toString('base64');
    
    if (!result) {
      throw new Error('Encryption failed - empty result');
    }
    
    console.log('Encryption - Successfully completed');
    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  const encryptionKey = validateEncryptionKey();

  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    if (combined.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted data: Data is too short');
    }

    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH).toString('hex');
    
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption - Error:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 