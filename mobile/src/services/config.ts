import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiConfig {
  baseUrl: string;
  name: string;
  description: string;
}

export const API_CONFIGS: Record<string, ApiConfig> = {
  local: {
    baseUrl: 'http://192.168.1.66:5000/api',
    name: 'Local Development',
    description: 'Local backend server'
  },
  hosted: {
    baseUrl: 'https://foci-production.up.railway.app/api', // Replace with your actual Railway URL
    name: 'Hosted (Railway)',
    description: 'Production backend on Railway'
  }
};

class ConfigService {
  private currentConfig: ApiConfig = API_CONFIGS.local;
  private configKey = 'api_config';

  constructor() {
    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem(this.configKey);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.currentConfig = config;
      }
    } catch (error) {
      console.warn('Failed to load API config, using default:', error);
    }
  }

  async setConfig(configKey: string): Promise<void> {
    if (API_CONFIGS[configKey]) {
      this.currentConfig = API_CONFIGS[configKey];
      await AsyncStorage.setItem(this.configKey, JSON.stringify(this.currentConfig));
    }
  }

  getCurrentConfig(): ApiConfig {
    return this.currentConfig;
  }

  getBaseUrl(): string {
    return this.currentConfig.baseUrl;
  }

  getAvailableConfigs(): Record<string, ApiConfig> {
    return API_CONFIGS;
  }

  async   getCurrentConfigKey(): Promise<string> {
    const config = this.getCurrentConfig();
    for (const [key, value] of Object.entries(API_CONFIGS)) {
      if (value.baseUrl === config.baseUrl) {
        return key;
      }
    }
    return 'local'; // Default fallback
  }

  // Google Sign-In Configuration
  getGoogleWebClientId(): string {
    // Web OAuth client from google-services.json (client_type 3)
    return process.env.GOOGLE_WEB_CLIENT_ID || '416233535798-dpehu9uiun1nlub5nu1rgi36qog1e57j.apps.googleusercontent.com';
  }


  getGoogleAndroidClientId(): string {
    // This is the Android client ID from google-services.json
    return process.env.GOOGLE_ANDROID_CLIENT_ID || '416233535798-dvmtmqjgmrmmrm4uv0lgqos02od26sh0.apps.googleusercontent.com';
  }

  getGoogleIosClientId(): string {
    // This is the iOS client ID from GoogleService-Info.plist
    return process.env.GOOGLE_IOS_CLIENT_ID || '416233535798-dpehu9uiun1nlub5nu1rgi36qog1e57j.apps.googleusercontent.com';
  }
}

export const configService = new ConfigService();


