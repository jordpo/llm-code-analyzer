/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // Base delay in milliseconds
  maxDelay?: number; // Maximum delay in milliseconds
  backoffMultiplier?: number;
  retryableErrors?: string[]; // Error types that should trigger retry
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'rate_limit_error',
    'timeout',
    'server_error',
    'network_error',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND'
  ]
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorMessage = error.message || '';
  const errorType = error.type || error.code || '';
  const statusCode = error.status || error.statusCode;

  // Check for specific error types
  if (retryableErrors.some(type =>
    errorMessage.includes(type) || errorType.includes(type)
  )) {
    return true;
  }

  // Check for retryable HTTP status codes
  if (statusCode === 429 || statusCode === 503 || statusCode === 500) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt);
  const delay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (random variation) to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();

  return delay + jitter;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error; // Don't retry non-retryable errors
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.baseDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Log retry attempt (in production, use proper logging)
      if (process.env.NODE_ENV !== 'test') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(
          `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms. Error: ${errorMessage}`
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Decorator for retry logic (for class methods)
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
