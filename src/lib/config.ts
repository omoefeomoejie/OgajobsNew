/**
 * Centralized configuration management for production environment
 */

export interface AppConfig {
  environment: 'development' | 'production' | 'staging';
  monitoring: {
    sentry: {
      enabled: boolean;
      dsn?: string;
    };
    performance: {
      enabled: boolean;
      sampleRate: number;
    };
    analytics: {
      enabled: boolean;
    };
  };
  features: {
    maintenanceMode: boolean;
    newUserRegistration: boolean;
    advancedAnalytics: boolean;
    aiRecommendations: boolean;
  };
  alerts: {
    errorThreshold: number;
    performanceThreshold: number;
    uptimeThreshold: number;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): AppConfig {
    const environment = this.detectEnvironment();
    
    const baseConfig: AppConfig = {
      environment,
      monitoring: {
        sentry: {
          enabled: environment === 'production',
        },
        performance: {
          enabled: true,
          sampleRate: environment === 'production' ? 0.1 : 1.0,
        },
        analytics: {
          enabled: environment === 'production',
        },
      },
      features: {
        maintenanceMode: false,
        newUserRegistration: true,
        advancedAnalytics: environment === 'production',
        aiRecommendations: true,
      },
      alerts: {
        errorThreshold: 0.05, // 5% error rate
        performanceThreshold: 3000, // 3 seconds
        uptimeThreshold: 0.99, // 99% uptime
      },
    };

    return baseConfig;
  }

  private detectEnvironment(): 'development' | 'production' | 'staging' {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      if (hostname.includes('staging')) {
        return 'staging';
      }
      return 'production';
    }
    return 'development';
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  public updateFeatureFlag(feature: keyof AppConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  public getMonitoringConfig() {
    return this.config.monitoring;
  }

  public getAlertsConfig() {
    return this.config.alerts;
  }
}

export const configManager = ConfigManager.getInstance();
export const config = configManager.getConfig();