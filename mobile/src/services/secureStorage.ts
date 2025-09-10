import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Android Secure Storage Service
 * 
 * Provides secure storage for sensitive data using Android's EncryptedSharedPreferences.
 * This service replaces AsyncStorage for authentication tokens and user data to ensure
 * they are encrypted and protected from device backups and rooted device access.
 * 
 * Security Benefits:
 * - Uses Android's native EncryptedSharedPreferences
 * - Hardware-backed encryption on supported devices
 * - Protection against device backups and rooted access
 * - Automatic key management by Android Keystore
 */
interface SecureStorageService {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  has(key: string): Promise<boolean>;
}

class AndroidSecureStorageService implements SecureStorageService {
  private static instance: AndroidSecureStorageService;

  private constructor() {}

  public static getInstance(): AndroidSecureStorageService {
    if (!AndroidSecureStorageService.instance) {
      AndroidSecureStorageService.instance = new AndroidSecureStorageService();
    }
    return AndroidSecureStorageService.instance;
  }

  /**
   * Store a value securely using Android's EncryptedSharedPreferences
   * @param key - The key to store the value under
   * @param value - The value to store (will be encrypted)
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(key, value);
    } catch (error) {
      console.error(`🔐 SecureStorage: Error setting ${key}:`, error);
      throw new Error(`Failed to securely store ${key}`);
    }
  }

  /**
   * Retrieve a value from secure storage
   * @param key - The key to retrieve
   * @returns The decrypted value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem(key);
    } catch (error) {
      console.error(`🔐 SecureStorage: Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value from secure storage
   * @param key - The key to remove
   */
  async remove(key: string): Promise<void> {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      console.error(`🔐 SecureStorage: Error removing ${key}:`, error);
    }
  }

  /**
   * Remove multiple values from secure storage
   * @param keys - Array of keys to remove
   */
  async multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.remove(key)));
  }

  /**
   * Check if a key exists in secure storage
   * @param key - The key to check
   * @returns True if the key exists, false otherwise
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}

// Export singleton instance
export const secureStorage = AndroidSecureStorageService.getInstance();
