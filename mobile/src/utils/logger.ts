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
    if (this.isDebugEnabled()) {
      console.error(this.formatMessage('error', message), ...args);
    } else {
      console.error(this.formatMessage('error', message));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      console.warn(this.formatMessage('warn', message), ...args);
    } else {
      console.warn(this.formatMessage('warn', message));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      console.log(this.formatMessage('info', message), ...args);
    } else {
      console.log(this.formatMessage('info', message));
    }
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
          if (value == null) {
            return `${key}: [NULL]`;
          } else if (typeof value === 'string') {
            if (value === '') {
              return `${key}: [EMPTY]`;
            } else {
              return `${key}: [REDACTED]`;
            }
          } else if (typeof value === 'boolean') {
            return `${key}: ${value}`;
          } else if (typeof value === 'number') {
            return `${key}: ${value}`;
          } else {
            // Any other/unknown type
            return `${key}: [REDACTED]`;
          }
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
