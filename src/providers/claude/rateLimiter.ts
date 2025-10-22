/**
 * Token bucket rate limiter for API requests
 * Prevents hitting API rate limits
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // Tokens per second
  private lastRefill: number;

  constructor(maxTokens: number = 50, refillRate: number = 5) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to consume tokens
   * Returns true if successful, false if not enough tokens
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Wait until enough tokens are available
   */
  async waitForToken(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time
    const tokensNeeded = tokens - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000; // Convert to milliseconds

    await new Promise(resolve => setTimeout(resolve, waitTime));

    this.tokens = 0; // Consume all available tokens after waiting
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Request queue for managing concurrent requests
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>>;
  private processing: number;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.queue = [];
    this.processing = 0;
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add request to queue and execute when possible
   */
  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.processing++;

    try {
      await request();
    } finally {
      this.processing--;
      this.processQueue(); // Process next request
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): { queued: number; processing: number } {
    return {
      queued: this.queue.length,
      processing: this.processing
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }
}
