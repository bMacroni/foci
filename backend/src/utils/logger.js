// Logger utility with rate limiting to prevent Railway rate limit issues
class Logger {
  constructor() {
    this.logCounts = new Map();
    this.lastReset = Date.now();
    this.maxLogsPerMinute = 100; // Conservative limit
    this.resetInterval = 60000; // 1 minute
  }

  _shouldLog(level, message) {
    const now = Date.now();
    
    // Reset counters every minute
    if (now - this.lastReset > this.resetInterval) {
      this.logCounts.clear();
      this.lastReset = now;
    }

    // Check if we've exceeded the rate limit
    const key = `${level}:${message}`;
    const count = this.logCounts.get(key) || 0;
    
    if (count >= this.maxLogsPerMinute) {
      return false;
    }

    this.logCounts.set(key, count + 1);
    return true;
  }

  _log(level, message, ...args) {
    if (!this._shouldLog(level, message)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, ...args);
        break;
      case 'warn':
        console.warn(logMessage, ...args);
        break;
      case 'info':
        console.log(logMessage, ...args);
        break;
      case 'debug':
        // Only log debug in development
        if (process.env.NODE_ENV === 'development') {
          console.log(logMessage, ...args);
        }
        break;
      default:
        console.log(logMessage, ...args);
    }
  }

  error(message, ...args) {
    this._log('error', message, ...args);
  }

  warn(message, ...args) {
    this._log('warn', message, ...args);
  }

  info(message, ...args) {
    this._log('info', message, ...args);
  }

  debug(message, ...args) {
    this._log('debug', message, ...args);
  }

  // Special method for CRON jobs to reduce logging frequency
  cron(message, ...args) {
    // Only log CRON messages once per minute per unique message
    const key = `cron:${message}`;
    const count = this.logCounts.get(key) || 0;
    
    if (count === 0) {
      this._log('info', message, ...args);
      this.logCounts.set(key, 1);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
