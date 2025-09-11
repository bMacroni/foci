// Mobile logger utility with debug gating to prevent PII exposure
class Logger {
  private isDebugEnabled(): boolean {
    return __DEV__;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('info', message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  // Special method for auth-related debug logging that never exposes PII
  authDebug(message: string, data: Record<string, boolean | string | number> = {}): void {
    if (this.isDebugEnabled()) {
      // Only log non-sensitive boolean flags, numbers, and redacted placeholders
      const safeData = Object.entries(data)
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return `${key}: ${value}`;
          } else if (typeof value === 'number') {
            return `${key}: ${value}`;
          } else if (typeof value === 'string') {
            // Redact any potentially sensitive strings
            return `${key}: ${value ? '[REDACTED]' : 'null'}`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
      
      const logMessage = safeData ? `${message} - ${safeData}` : message;
      console.log(this.formatMessage('debug', `🔐 AuthService: ${logMessage}`));
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
