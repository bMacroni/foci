# Enhanced Error Handling System

## Overview

The enhanced error handling system provides comprehensive error management for the mobile calendar application with specific error messages, retry mechanisms with exponential backoff, circuit breaker patterns, and user-friendly error states.

## Features

### 1. Error Classification
- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: Invalid tokens, expired sessions
- **Authorization Errors**: Insufficient permissions
- **Validation Errors**: Invalid input data
- **Server Errors**: Backend service issues
- **Timeout Errors**: Request timeouts

### 2. User-Friendly Error Messages
- Context-specific error messages for different operations
- Clear action buttons (Retry, Sign In, Fix, etc.)
- Severity-based styling (Critical, High, Medium, Low)
- Localized error descriptions

### 3. Retry Mechanisms
- Exponential backoff with jitter
- Category-specific retry strategies
- Configurable retry limits
- Smart retry logic (don't retry auth errors)

### 4. Circuit Breaker Pattern
- Prevents cascading failures
- Automatic recovery after timeout
- Half-open state for testing
- Per-endpoint circuit breakers

### 5. Error Recovery Flows
- Automatic retry with backoff
- Fallback to cached data
- Graceful degradation
- Error state management

## Architecture

### Core Components

#### 1. Error Handling Service (`errorHandling.ts`)
```typescript
// Main error handling service
export const errorHandlingService = new ErrorHandlingService();

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

// Error categories
export enum ErrorCategory {
  CALENDAR = 'CALENDAR',
  TASKS = 'TASKS',
  GOALS = 'GOALS',
  AUTH = 'AUTH',
  SYNC = 'SYNC',
  GENERAL = 'GENERAL',
}

// User-friendly error interface
export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  retryable: boolean;
  severity: ErrorSeverity;
  category: ErrorCategory;
}
```

#### 2. Enhanced API Wrapper (`enhancedApi.ts`)
```typescript
// Enhanced API with built-in error handling
export const enhancedAPI = new EnhancedAPI();

// Usage example
const events = await enhancedAPI.getEvents(50);
```

#### 3. Error Recovery Service (`errorRecovery.ts`)
```typescript
// Advanced error recovery with circuit breakers
export const errorRecoveryService = new ErrorRecoveryService();

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service is back
}
```

#### 4. Error Display Components (`ErrorDisplay.tsx`)
```typescript
// Reusable error display components
export const ErrorDisplay: React.FC<ErrorDisplayProps>;
export const ErrorBanner: React.FC<ErrorDisplayProps>;
export const ErrorModal: React.FC<ErrorDisplayProps & { visible: boolean }>;
```

## Usage Examples

### 1. Basic Error Handling
```typescript
import { enhancedAPI } from '../services/enhancedApi';
import { errorHandlingService, ErrorCategory } from '../services/errorHandling';

try {
  const events = await enhancedAPI.getEvents();
  // Handle success
} catch (error) {
  // Error is already a UserFriendlyError
  if (error.title && error.message) {
    setCurrentError(error);
    setErrorVisible(true);
  }
}
```

### 2. Advanced Error Recovery
```typescript
import { errorRecoveryService } from '../utils/errorRecovery';

const result = await errorRecoveryService.executeWithRecovery(
  () => enhancedAPI.getEvents(),
  'calendar/events',
  ErrorCategory.CALENDAR,
  { operation: 'loadCalendarData' }
);
```

### 3. Error Display in Components
```typescript
import { ErrorDisplay, ErrorBanner } from '../components/common/ErrorDisplay';

// For critical errors (banner at top)
{currentError && currentError.severity === 'CRITICAL' && (
  <ErrorBanner
    error={currentError}
    onRetry={() => loadCalendarData()}
    onDismiss={() => setCurrentError(null)}
    onAction={(action) => {
      if (action === 'signIn') {
        // Navigate to sign in
      }
    }}
  />
)}

// For non-critical errors (inline)
{currentError && currentError.severity !== 'CRITICAL' && (
  <ErrorDisplay
    error={currentError}
    onRetry={() => loadCalendarData()}
    onDismiss={() => setCurrentError(null)}
  />
)}
```

## Error Categories and Messages

### Calendar Errors
- **Network**: "Calendar Unavailable - Unable to load your calendar. Please check your internet connection and try again."
- **Authentication**: "Authentication Required - Please sign in again to access your calendar."
- **Server**: "Calendar Service Unavailable - Our calendar service is temporarily unavailable. Please try again in a few minutes."
- **Validation**: "Invalid Calendar Data - The calendar information provided is invalid. Please check your input and try again."
- **Timeout**: "Calendar Loading Timeout - Loading your calendar is taking longer than expected. Please try again."

### Task Errors
- **Network**: "Tasks Unavailable - Unable to load your tasks. Please check your internet connection and try again."
- **Authentication**: "Authentication Required - Please sign in again to access your tasks."
- **Server**: "Task Service Unavailable - Our task service is temporarily unavailable. Please try again in a few minutes."
- **Validation**: "Invalid Task Data - The task information provided is invalid. Please check your input and try again."

### Sync Errors
- **Network**: "Sync Failed - Unable to sync your data. Changes will be saved locally and synced when connection is restored."
- **Server**: "Sync Service Unavailable - Our sync service is temporarily unavailable. Your changes are saved locally."

## Retry Strategies

### Calendar Operations
- **Max Retries**: 3
- **Base Delay**: 1000ms
- **Max Delay**: 10000ms
- **Backoff Multiplier**: 2
- **Jitter**: Enabled

### Task Operations
- **Max Retries**: 3
- **Base Delay**: 1000ms
- **Max Delay**: 10000ms
- **Backoff Multiplier**: 2
- **Jitter**: Enabled

### Sync Operations
- **Max Retries**: 5
- **Base Delay**: 2000ms
- **Max Delay**: 30000ms
- **Backoff Multiplier**: 1.5
- **Jitter**: Enabled

### Authentication Operations
- **Max Retries**: 1
- **Base Delay**: 1000ms
- **Max Delay**: 2000ms
- **Backoff Multiplier**: 1
- **Jitter**: Disabled

## Circuit Breaker Configuration

### Default Settings
- **Failure Threshold**: 5 failures
- **Recovery Timeout**: 30 seconds
- **Expected Errors**: Network, Server, Timeout

### Circuit Breaker States
1. **CLOSED**: Normal operation, requests pass through
2. **OPEN**: Service failing, requests are rejected immediately
3. **HALF_OPEN**: Testing if service is back, limited requests allowed

## Error Severity Levels

### Critical
- Authentication errors
- Requires immediate user action
- Red styling with warning icon

### High
- Network errors during sync
- Service unavailability
- Orange styling with warning icon

### Medium
- Server errors
- Validation errors
- Blue styling with info icon

### Low
- Minor validation errors
- Informational messages
- Gray styling with info icon

## Integration with Existing Code

### 1. Replace API Calls
```typescript
// Old way
import { calendarAPI } from '../services/api';
const events = await calendarAPI.getEvents();

// New way
import { enhancedAPI } from '../services/enhancedApi';
const events = await enhancedAPI.getEvents();
```

### 2. Add Error Display
```typescript
// Add error state
const [currentError, setCurrentError] = useState<UserFriendlyError | null>(null);

// Handle errors
try {
  const result = await enhancedAPI.getEvents();
} catch (error) {
  if (error && typeof error === 'object' && 'title' in error) {
    setCurrentError(error as UserFriendlyError);
  }
}

// Display errors
{currentError && (
  <ErrorDisplay
    error={currentError}
    onRetry={() => loadData()}
    onDismiss={() => setCurrentError(null)}
  />
)}
```

### 3. Monitor Circuit Breakers
```typescript
import { errorRecoveryService } from '../utils/errorRecovery';

// Get status for specific endpoint
const status = errorRecoveryService.getCircuitBreakerStatus('calendar/events');

// Get all statuses
const allStatuses = errorRecoveryService.getAllCircuitBreakerStatuses();

// Reset circuit breaker
errorRecoveryService.resetCircuitBreaker('calendar/events');
```

## Best Practices

### 1. Error Handling
- Always use the enhanced API wrapper
- Handle UserFriendlyError objects appropriately
- Provide meaningful retry actions
- Clear error state after successful operations

### 2. User Experience
- Show critical errors as banners
- Show non-critical errors inline
- Provide clear action buttons
- Allow users to dismiss errors

### 3. Monitoring
- Monitor circuit breaker states
- Track error patterns
- Reset circuit breakers when needed
- Log error context for debugging

### 4. Performance
- Use appropriate retry strategies
- Implement circuit breakers for failing services
- Cache data for offline scenarios
- Minimize retry attempts for non-retryable errors

## Testing

### 1. Error Scenarios
```typescript
// Test network errors
// Disconnect network and make API calls

// Test server errors
// Mock 500 responses

// Test authentication errors
// Mock 401 responses

// Test timeout errors
// Mock slow responses
```

### 2. Circuit Breaker Testing
```typescript
// Test circuit breaker opening
// Make multiple failing requests

// Test circuit breaker recovery
// Wait for timeout and make successful request

// Test half-open state
// Make limited requests during recovery
```

### 3. Error Display Testing
```typescript
// Test different error severities
// Test retry functionality
// Test dismiss functionality
// Test action handling
```

## Migration Guide

### 1. Update Imports
```typescript
// Remove old imports
import { calendarAPI, tasksAPI, goalsAPI } from '../services/api';

// Add new imports
import { enhancedAPI } from '../services/enhancedApi';
import { errorHandlingService, ErrorCategory } from '../services/errorHandling';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
```

### 2. Update API Calls
```typescript
// Replace all API calls
const events = await enhancedAPI.getEvents();
const tasks = await enhancedAPI.getTasks();
const goals = await enhancedAPI.getGoals();
```

### 3. Add Error Handling
```typescript
// Add error state
const [currentError, setCurrentError] = useState<UserFriendlyError | null>(null);

// Update try-catch blocks
try {
  const result = await enhancedAPI.getEvents();
} catch (error) {
  if (error && typeof error === 'object' && 'title' in error) {
    setCurrentError(error as UserFriendlyError);
  }
}
```

### 4. Add Error Display
```typescript
// Add error display components
{currentError && (
  <ErrorDisplay
    error={currentError}
    onRetry={() => loadData()}
    onDismiss={() => setCurrentError(null)}
  />
)}
```

## Troubleshooting

### Common Issues

1. **Errors not displaying**: Check if error object has `title` and `message` properties
2. **Retry not working**: Verify error is retryable and retry count hasn't exceeded limit
3. **Circuit breaker stuck**: Reset circuit breaker manually or wait for timeout
4. **Performance issues**: Check retry strategy configuration and circuit breaker settings

### Debug Information

```typescript
// Get error logs
const errorLogs = await errorHandlingService.getErrorLogs();

// Get circuit breaker status
const status = errorRecoveryService.getCircuitBreakerStatus('endpoint');

// Check network status
const isOnline = await errorHandlingService.getNetworkStatus();
```

## Future Enhancements

1. **Analytics Integration**: Track error patterns and user behavior
2. **A/B Testing**: Test different error messages and recovery strategies
3. **Machine Learning**: Predict and prevent errors based on patterns
4. **Advanced Circuit Breakers**: Per-user and per-operation circuit breakers
5. **Error Reporting**: Integration with external error reporting services 