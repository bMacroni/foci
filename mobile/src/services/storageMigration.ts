import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage';

/**
 * Android Storage Migration Service
 * 
 * Handles migration of authentication data from insecure AsyncStorage
 * to secure encrypted storage. This ensures existing users don't lose
 * their authentication state when upgrading to the secure storage system.
 * 
 * Migration Process:
 * 1. Check if migration is needed (AsyncStorage has auth data)
 * 2. Migrate each auth key to secure storage
 * 3. Remove data from AsyncStorage after successful migration
 * 4. Provide detailed logging and error handling
 */
interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  failedKeys: string[];
  errors: string[];
}

class AndroidStorageMigrationService {
  private static readonly AUTH_KEYS = [
    'auth_token',
    'authToken', 
    'auth_user',
    'authUser'
  ];

  /**
   * Migrate authentication data from AsyncStorage to secure storage
   * @returns MigrationResult with details about the migration process
   */
  static async migrateAuthData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedKeys: [],
      failedKeys: [],
      errors: []
    };

    console.log('🔐 Starting Android auth data migration to encrypted storage...');

    for (const key of this.AUTH_KEYS) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          // Store in secure storage
          await secureStorage.set(key, value);
          
          // Remove from insecure storage after successful migration
          await AsyncStorage.removeItem(key);
          
          result.migratedKeys.push(key);
          console.log(`✅ Migrated ${key} to encrypted storage`);
        }
      } catch (error) {
        result.success = false;
        result.failedKeys.push(key);
        const errorMessage = `Failed to migrate ${key}: ${error}`;
        result.errors.push(errorMessage);
        console.error(`❌ ${errorMessage}`);
      }
    }

    const summary = `Migration complete. Migrated: ${result.migratedKeys.length}, Failed: ${result.failedKeys.length}`;
    console.log(`🔐 ${summary}`);
    
    if (result.migratedKeys.length > 0) {
      console.log('🔐 Successfully migrated keys:', result.migratedKeys);
    }
    
    if (result.failedKeys.length > 0) {
      console.warn('⚠️ Failed to migrate keys:', result.failedKeys);
      console.warn('⚠️ Errors:', result.errors);
    }

    return result;
  }

  /**
   * Check if migration is needed by looking for auth data in AsyncStorage
   * @returns True if migration is needed, false otherwise
   */
  static async checkMigrationNeeded(): Promise<boolean> {
    for (const key of this.AUTH_KEYS) {
      const hasInSecure = await AsyncStorage.getItem(key);
      if (hasInSecure) {
        console.log(`🔐 Migration needed: Found ${key} in AsyncStorage`);
        return true;
      }
    }
    return false;
  }

  /**
   * Get a list of keys that need migration
   * @returns Array of keys that exist in AsyncStorage and need migration
   */
  static async getKeysNeedingMigration(): Promise<string[]> {
    const keysNeedingMigration: string[] = [];
    
    for (const key of this.AUTH_KEYS) {
      const hasInSecure = await AsyncStorage.getItem(key);
      if (hasInSecure) {
        keysNeedingMigration.push(key);
      }
    }
    
    return keysNeedingMigration;
  }

  /**
   * Verify that migration was successful by checking secure storage
   * @param migratedKeys - Array of keys that were migrated
   * @returns True if all migrated keys exist in secure storage
   */
  static async verifyMigration(migratedKeys: string[]): Promise<boolean> {
    for (const key of migratedKeys) {
      const existsInSecure = await secureStorage.has(key);
      if (!existsInSecure) {
        console.error(`❌ Migration verification failed: ${key} not found in secure storage`);
        return false;
      }
    }
    
    console.log('✅ Migration verification successful: All keys found in secure storage');
    return true;
  }
}

export { AndroidStorageMigrationService };
